import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto, AvailabilityRangeDto } from './dto/availability.dto';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Real slot availability for one day (IST)',
    description:
      'Honours weekly rules, per-staff schedules, time off, buffers, notice period, max advance window and existing bookings.',
  })
  day(@Query() query: AvailabilityQueryDto) {
    return this.availability.getDay(query.serviceId, query.date, query.staffId);
  }

  @Public()
  @Get('range')
  @ApiOperation({ summary: 'Availability across a date range (max 31 days)' })
  range(@Query() query: AvailabilityRangeDto) {
    return this.availability.getRange(query.serviceId, query.from, query.to, query.staffId);
  }
}
