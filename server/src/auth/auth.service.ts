import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  NotificationChannel,
  NotificationKind,
  OtpPurpose,
  Prisma,
  Role,
  User,
  UserStatus,
  VendorStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { sixDigitCode, slugify } from '../common/utils/refs';
import {
  ChangePasswordDto,
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { RegisterDto, RegistrationRole } from './dto/register.dto';

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  city: true,
  status: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  createdAt: true,
  vendor: { select: { id: true, name: true, slug: true, status: true } },
} satisfies Prisma.UserSelect;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly redis: RedisService,
  ) {}

  private get accessSecret() {
    return this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret-change-me-in-production-000000';
  }

  private get refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change-me-in-production-0000';
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(user: Pick<User, 'id' | 'email' | 'role'>, vendorId?: string | null): Promise<TokenPair> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, vendorId: vendorId ?? null },
      { secret: this.accessSecret, expiresIn: accessTtl as never },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = this.refreshDays();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  private refreshDays() {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const match = /^(\d+)d$/.exec(ttl);
    return match ? Number(match[1]) : 30;
  }

  private async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { vendor: { select: { id: true, name: true, slug: true, status: true } } },
    });
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const role = dto.role === RegistrationRole.VENDOR ? Role.VENDOR : Role.CUSTOMER;
    if (role === Role.VENDOR && !dto.businessName) {
      throw new BadRequestException('Business name is required for vendor accounts.');
    }

    let categoryId = dto.categoryId;
    if (role === Role.VENDOR && !categoryId) {
      const firstCategory = await this.prisma.category.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      categoryId = firstCategory?.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone,
        city: dto.city,
        role,
        ...(role === Role.VENDOR && categoryId
          ? {
              vendor: {
                create: {
                  slug: `${slugify(dto.businessName!)}-${randomBytes(2).toString('hex')}`,
                  name: dto.businessName!,
                  tagline: 'Trusted local professional',
                  description: `${dto.businessName} serves customers across ${dto.city}.`,
                  categoryId,
                  city: dto.city,
                  area: dto.area ?? dto.city,
                  address: `${dto.area ?? ''}, ${dto.city}`.replace(/^, /, ''),
                  email,
                  phone: dto.phone,
                  status: VendorStatus.PENDING,
                  priceFromPaise: 0,
                },
              },
            }
          : {}),
      },
      include: { vendor: { select: { id: true, name: true, slug: true, status: true } } },
    });

    const tokens = await this.issueTokens(user, user.vendor?.id);

    this.notifications
      .send({
        userId: user.id,
        kind: NotificationKind.SYSTEM,
        title: role === Role.VENDOR ? 'Vendor application started' : 'Welcome to Servora',
        body:
          role === Role.VENDOR
            ? 'Complete your onboarding to start receiving bookings.'
            : 'Browse verified pros and book your first service — use WELCOME10 for 10% off.',
        href: role === Role.VENDOR ? '/vendor/onboarding' : '/customer/dashboard',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        email,
      })
      .catch((error) => this.logger.warn(`Welcome notification failed: ${error.message}`));

    const devCode = await this.createOtp(email, OtpPurpose.EMAIL_VERIFICATION);
    return {
      user: this.sanitize(user),
      tokens,
      verification: { required: true, ...(devCode ? { devCode } : {}) },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Incorrect email or password.');
    if (user.status === UserStatus.BLOCKED) throw new ForbiddenException('This account has been blocked.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Incorrect email or password.');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user, user.vendor?.id);
    return { user: this.sanitize(user), tokens };
  }

  async demoLogin(role: 'customer' | 'vendor' | 'admin') {
    const env = this.config.get<string>('NODE_ENV');
    if (env === 'production' && this.config.get('ENABLE_DEMO_LOGIN') !== 'true') {
      throw new ForbiddenException('Demo login is disabled in production.');
    }
    const account = await this.prisma.user.findFirst({ where: { role: role.toUpperCase() as Role } });
    if (!account) throw new UnauthorizedException('Demo account not seeded. Run `npm run seed`.');
    const tokens = await this.issueTokens(account, (account as unknown as { vendor?: { id: string } }).vendor?.id);
    const full = await this.findByEmail(account.email);
    return { user: this.sanitize(full!), tokens };
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: { include: { vendor: { select: { id: true } } } } },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return {
      user: this.sanitize(stored.user),
      tokens: await this.issueTokens(stored.user, stored.user.vendor?.id),
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { revoked: true };
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('Account not found.');
    return this.sanitize(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { updated: true };
  }

  // ---------------------------------- OTP -----------------------------------

  async createOtp(email: string, purpose: OtpPurpose) {
    const normalized = email.trim().toLowerCase();
    const throttleKey = `otp:${normalized}:${purpose}`;
    const attempts = await this.redis.increment(throttleKey, 10 * 60);
    if (attempts > 6) throw new BadRequestException('Too many codes requested. Try again in a few minutes.');

    const code = sixDigitCode();
    await this.prisma.otpCode.create({
      data: {
        email: normalized,
        codeHash: await bcrypt.hash(code, 10),
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (user) {
      await this.notifications
        .send({
          userId: user.id,
          kind: NotificationKind.SYSTEM,
          title: 'Your Servora verification code',
          body: `Use code ${code} to verify your account. It expires in 10 minutes.`,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          email: normalized,
        })
        .catch(() => undefined);
    } else {
      // Still send the email through the queue so the API doesn't leak account existence.
      try {
        await this.notifications.send({
          userId: 'system',
          kind: NotificationKind.SYSTEM,
          title: 'Your Servora verification code',
          body: `Use code ${code} to verify your account.`,
          channels: [NotificationChannel.EMAIL],
          email: normalized,
        });
      } catch {
        /* unknown emails get no notification row */
      }
    }

    return this.config.get('NODE_ENV') === 'production' ? undefined : code;
  }

  async requestOtp(dto: OtpRequestDto) {
    const devCode = await this.createOtp(dto.email, dto.purpose);
    return {
      sent: true,
      expiresInSeconds: 600,
      message: 'If an account exists for this email, a verification code has been sent.',
      ...(devCode ? { devCode } : {}),
    };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const email = dto.email.trim().toLowerCase();
    const record = await this.prisma.otpCode.findFirst({
      where: { email, purpose: dto.purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException('This code has expired. Request a new one.');
    if (record.attempts >= 5) throw new BadRequestException('Too many attempts. Request a new code.');

    const valid = await bcrypt.compare(dto.code, record.codeHash);
    if (!valid) {
      await this.prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('That code is incorrect. Please try again.');
    }

    await this.prisma.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (dto.purpose === OtpPurpose.EMAIL_VERIFICATION && user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
      return { verified: true, tokens: await this.issueTokens(user) };
    }

    if (dto.purpose === OtpPurpose.LOGIN && user) {
      return { verified: true, tokens: await this.issueTokens(user), user: this.sanitize(user) };
    }

    const resetToken = await this.jwt.signAsync(
      { sub: user?.id ?? email, email, purpose: 'password-reset' },
      { secret: this.accessSecret, expiresIn: '10m' },
    );
    return { verified: true, resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; email: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(dto.token, { secret: this.accessSecret });
    } catch {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }
    if (payload.purpose !== 'password-reset') throw new BadRequestException('Invalid reset token.');
    if (payload.email !== dto.email.trim().toLowerCase()) {
      throw new BadRequestException('This reset token does not match the email.');
    }

    const user = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) throw new BadRequestException('Account not found.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { reset: true };
  }

  // --------------------------------- Helpers --------------------------------

  private sanitize(user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: Role;
    city?: string | null;
    status?: UserStatus;
    avatarUrl?: string | null;
    createdAt?: Date;
    emailVerifiedAt?: Date | null;
    vendor?: { id: string; name?: string; slug?: string; status?: VendorStatus } | null;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role.toLowerCase(),
      city: user.city ?? null,
      status: user.status ?? 'ACTIVE',
      avatarUrl: user.avatarUrl ?? null,
      emailVerified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt,
      vendorId: user.vendor?.id ?? null,
      vendor: user.vendor
        ? { id: user.vendor.id, name: user.vendor.name, slug: user.vendor.slug, status: user.vendor.status }
        : null,
    };
  }
}
