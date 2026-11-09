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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdminService } from './admin.service';
import {
  AdminQueryDto,
  ApplicationDecisionDto,
  CategoryDto,
  CmsPageDto,
  InviteAdminDto,
  ModerateServiceDto,
  UpdateCommissionDto,
  UpdateSettingsDto,
  UpdateUserStatusDto,
  UpdateVendorStatusDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Marketplace command centre KPIs and charts' })
  dashboard() {
    return this.admin.dashboard();
  }

  // -------------------------------- Customers --------------------------------

  @Get('customers')
  @ApiOperation({ summary: 'List customers with booking and spend history' })
  customers(@Query() query: AdminQueryDto) {
    return this.admin.users(query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Customer 360 view' })
  customer(@Param('id') id: string) {
    return this.admin.userDetail(id);
  }

  @Patch('customers/:id/status')
  @ApiOperation({ summary: 'Block, suspend or reactivate a customer' })
  customerStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.admin.updateUserStatus(id, dto);
  }

  // --------------------------------- Vendors ---------------------------------

  @Get('vendors')
  @ApiOperation({ summary: 'All vendors with status and counts' })
  vendors(@Query() query: AdminQueryDto) {
    return this.admin.vendors(query);
  }

  @Get('vendors/:id')
  @ApiOperation({ summary: 'Vendor 360 view' })
  vendor(@Param('id') id: string) {
    return this.admin.vendorDetail(id);
  }

  @Patch('vendors/:id/status')
  @ApiOperation({ summary: 'Approve, suspend or reject a vendor' })
  vendorStatus(@Param('id') id: string, @Body() dto: UpdateVendorStatusDto) {
    return this.admin.updateVendorStatus(id, dto);
  }

  @Patch('vendors/:id/commission')
  @ApiOperation({ summary: 'Override a vendor commission rate' })
  vendorCommission(@Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.admin.updateCommission(id, dto);
  }

  // ------------------------------ Applications -------------------------------

  @Get('applications')
  @ApiOperation({ summary: 'Vendor applications queue' })
  applications(@Query() query: AdminQueryDto) {
    return this.admin.applications(query);
  }

  @Patch('applications/:id/decision')
  @ApiOperation({ summary: 'Approve, reject or review an application' })
  decide(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: ApplicationDecisionDto,
  ) {
    return this.admin.decideApplication(id, dto, adminId);
  }

  // --------------------------------- Services --------------------------------

  @Get('services')
  @ApiOperation({ summary: 'All services for moderation' })
  services(@Query() query: AdminQueryDto) {
    return this.admin.services(query);
  }

  @Patch('services/:id/moderate')
  @ApiOperation({ summary: 'Publish, archive or request changes on a service' })
  moderateService(@Param('id') id: string, @Body() dto: ModerateServiceDto) {
    return this.admin.moderateService(id, dto);
  }

  // -------------------------------- Categories -------------------------------

  @Get('categories')
  @ApiOperation({ summary: 'All categories including inactive' })
  categories() {
    return this.admin.categories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@Body() dto: CategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() dto: CategoryDto) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete or deactivate an empty category' })
  deleteCategory(@Param('id') id: string) {
    return this.admin.deleteCategory(id);
  }

  // ---------------------------------- Finance --------------------------------

  @Get('transactions')
  @ApiOperation({ summary: 'Gateway transactions' })
  transactions(@Query() query: PaginationDto & { status?: string }) {
    return this.admin.transactions(query);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'Refund ledger' })
  refunds(@Query() query: PaginationDto & { status?: string }) {
    return this.admin.refunds(query);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Commission earnings by vendor' })
  commissions() {
    return this.admin.commissions();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Revenue, growth and operations reports' })
  reports(@Query('range') range?: string) {
    return this.admin.reports(range);
  }

  // ------------------------------------ CMS ----------------------------------

  @Get('cms')
  @ApiOperation({ summary: 'CMS pages' })
  cms(@Query() query: AdminQueryDto) {
    return this.admin.cms(query);
  }

  @Post('cms')
  @ApiOperation({ summary: 'Create a CMS page' })
  createCms(@CurrentUser('id') adminId: string, @Body() dto: CmsPageDto) {
    return this.admin.createCms(dto, adminId);
  }

  @Patch('cms/:id')
  @ApiOperation({ summary: 'Update or publish a CMS page' })
  updateCms(@Param('id') id: string, @Body() dto: CmsPageDto) {
    return this.admin.updateCms(id, dto);
  }

  @Delete('cms/:id')
  @ApiOperation({ summary: 'Delete a CMS page' })
  deleteCms(@Param('id') id: string) {
    return this.admin.deleteCms(id);
  }

  // --------------------------------- Settings --------------------------------

  @Get('settings')
  @ApiOperation({ summary: 'Platform settings' })
  settings() {
    return this.admin.settings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Persist platform settings' })
  updateSettings(@CurrentUser('id') adminId: string, @Body() dto: UpdateSettingsDto) {
    return this.admin.updateSettings(dto, adminId);
  }

  // ----------------------------------- Team ----------------------------------

  @Get('team')
  @ApiOperation({ summary: 'Admin team and role catalogue' })
  team() {
    return this.admin.team();
  }

  @Post('team/invite')
  @ApiOperation({ summary: 'Invite an admin (temp password returned in dev)' })
  invite(@CurrentUser('id') adminId: string, @Body() dto: InviteAdminDto) {
    return this.admin.inviteAdmin(dto, adminId);
  }
}
