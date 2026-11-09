import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditService } from './audit.service';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated, filterable, immutable audit trail' })
  list(
    @Query() query: PaginationDto,
    @Query('severity') severity?: string,
    @Query('entity') entity?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.audit.list({ ...query, severity, entity, actorId });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Audit trail counters for the last 24 hours' })
  stats() {
    return this.audit.stats();
  }
}
