import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto, DisputeQueryDto, ResolveDisputeDto } from './dto/dispute.dto';

@ApiTags('Disputes')
@ApiBearerAuth('access-token')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Roles('customer')
  @Post()
  @ApiOperation({ summary: 'Open a dispute for one of my bookings' })
  create(@CurrentUser('id') customerId: string, @Body() dto: CreateDisputeDto) {
    return this.disputes.create(customerId, dto);
  }

  @Roles('customer')
  @Get('mine')
  @ApiOperation({ summary: 'My disputes' })
  mine(@CurrentUser('id') customerId: string, @Query() query: DisputeQueryDto) {
    return this.disputes.listMine(customerId, query);
  }

  @Roles('vendor')
  @Get('vendor')
  @ApiOperation({ summary: 'Disputes against my business' })
  vendor(@CurrentUser('vendorId') vendorId: string | null, @Query() query: DisputeQueryDto) {
    return this.disputes.listVendor(vendorId ?? '__none__', query);
  }
}

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly disputes: DisputesService) {}

  @Get()
  @ApiOperation({ summary: 'All disputes with filters' })
  list(@Query() query: DisputeQueryDto) {
    return this.disputes.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Trust & safety counters' })
  stats() {
    return this.disputes.stats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Resolve or reject a dispute' })
  resolve(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(admin, id, dto);
  }
}
