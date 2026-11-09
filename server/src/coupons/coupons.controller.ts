import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../common/decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List live public offers' })
  active() {
    return this.coupons.active();
  }

  @ApiBearerAuth('access-token')
  @Post('validate')
  @ApiOperation({ summary: 'Validate a code and preview the discount' })
  validate(@Body() dto: ValidateCouponDto, @CurrentUser('id') userId: string) {
    return this.coupons.validate(dto, userId);
  }
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'List all coupons' })
  list(@Query() query: PaginationDto & { status?: string }) {
    return this.coupons.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Coupon performance counters' })
  stats() {
    return this.coupons.stats();
  }

  @Post()
  @ApiOperation({ summary: 'Create a coupon' })
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disable a coupon' })
  disable(@Param('id') id: string) {
    return this.coupons.disable(id);
  }
}
