import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PayoutsService } from './payouts.service';
import { RequestPayoutDto, UpdatePayoutDto } from './dto/payout.dto';

@ApiTags('Payouts')
@ApiBearerAuth('access-token')
@Controller('vendor')
export class VendorPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Roles('vendor')
  @Get('earnings')
  @ApiOperation({ summary: 'Vendor ledger, earnings and monthly breakdown' })
  earnings(@CurrentUser('vendorId') vendorId: string | null) {
    return this.payouts.earnings(vendorId);
  }

  @Roles('vendor')
  @Get('payouts')
  @ApiOperation({ summary: 'Vendor payout history' })
  list(@CurrentUser('vendorId') vendorId: string | null, @Query() query: PaginationDto) {
    return this.payouts.listVendor(vendorId, query);
  }

  @Roles('vendor')
  @Post('payouts')
  @ApiOperation({ summary: 'Request a payout against available balance' })
  request(@CurrentUser('vendorId') vendorId: string | null, @Body() dto: RequestPayoutDto) {
    return this.payouts.request(vendorId, dto);
  }
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  @ApiOperation({ summary: 'All payout requests with pending totals' })
  list(@Query() query: PaginationDto & { status?: string }) {
    return this.payouts.adminList(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Payout KPIs' })
  stats() {
    return this.payouts.stats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve, process, pay or reject a payout' })
  update(@Param('id') id: string, @Body() dto: UpdatePayoutDto) {
    return this.payouts.updateStatus(id, dto);
  }
}
