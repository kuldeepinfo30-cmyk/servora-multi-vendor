import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { VendorService } from './vendor.service';
import {
  CreateServiceDto,
  CreateStaffDto,
  ReplaceAvailabilityDto,
  TimeOffDto,
  UpdateServiceDto,
  UpdateVendorProfileDto,
} from './dto/vendor.dto';

@ApiTags('Vendor')
@ApiBearerAuth('access-token')
@Roles('vendor')
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendor: VendorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Vendor command centre data' })
  dashboard(@CurrentUser('vendorId') vendorId: string | null, @CurrentUser('id') userId: string) {
    return this.vendor.dashboard(vendorId, userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'My vendor profile with services and team' })
  profile(@CurrentUser('vendorId') vendorId: string | null) {
    return this.vendor.me(vendorId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update storefront and business details' })
  updateProfile(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: UpdateVendorProfileDto) {
    return this.vendor.updateProfile(vendorId, dto);
  }

  @Get('services')
  @ApiOperation({ summary: 'All my services (including drafts)' })
  services(@CurrentUser('vendorId') vendorId: string | null, @Query() query: PaginationDto & { status?: string }) {
    return this.vendor.services(vendorId, query);
  }

  @Post('services')
  @ApiOperation({ summary: 'Create a service with add-ons and booking questions' })
  createService(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: CreateServiceDto) {
    return this.vendor.createService(vendorId, dto);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Service detail (owner only)' })
  service(@CurrentUser('vendorId') vendorId: string | null, @Param('id') id: string) {
    return this.vendor.service(vendorId, id);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update a service' })
  updateService(
    @CurrentUser('vendorId') vendorId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.vendor.updateService(vendorId, id, dto);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Archive a service (blocked while upcoming bookings exist)' })
  archiveService(@CurrentUser('vendorId') vendorId: string | null, @Param('id') id: string) {
    return this.vendor.archiveService(vendorId, id);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Team members and their services' })
  staff(@CurrentUser('vendorId') vendorId: string | null) {
    return this.vendor.staff(vendorId);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Add a team member' })
  createStaff(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: CreateStaffDto) {
    return this.vendor.createStaff(vendorId, dto);
  }

  @Patch('staff/:id')
  @ApiOperation({ summary: 'Update a team member' })
  updateStaff(@CurrentUser('vendorId') vendorId: string | null, @Param('id') id: string, @Body() dto: CreateStaffDto) {
    return this.vendor.updateStaff(vendorId, id, dto);
  }

  @Delete('staff/:id')
  @ApiOperation({ summary: 'Remove or deactivate a team member' })
  removeStaff(@CurrentUser('vendorId') vendorId: string | null, @Param('id') id: string) {
    return this.vendor.removeStaff(vendorId, id);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Weekly availability rules and staff' })
  availability(@CurrentUser('vendorId') vendorId: string | null) {
    return this.vendor.availability(vendorId);
  }

  @Put('availability')
  @ApiOperation({ summary: 'Replace the weekly schedule atomically' })
  replaceAvailability(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: ReplaceAvailabilityDto) {
    return this.vendor.replaceAvailability(vendorId, dto);
  }

  @Get('time-off')
  @ApiOperation({ summary: 'Upcoming time off' })
  timeOff(@CurrentUser('vendorId') vendorId: string | null) {
    return this.vendor.timeOff(vendorId);
  }

  @Post('time-off')
  @ApiOperation({ summary: 'Block a date range' })
  addTimeOff(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: TimeOffDto) {
    return this.vendor.addTimeOff(vendorId, dto);
  }

  @Delete('time-off/:id')
  @ApiOperation({ summary: 'Remove a time-off block' })
  removeTimeOff(@CurrentUser('vendorId') vendorId: string | null, @Param('id') id: string) {
    return this.vendor.removeTimeOff(vendorId, id);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customers derived from booking history' })
  customers(@CurrentUser('vendorId') vendorId: string | null, @Query() query: PaginationDto) {
    return this.vendor.customers(vendorId, query);
  }
}
