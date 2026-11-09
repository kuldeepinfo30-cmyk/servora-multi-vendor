import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../common/decorators';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ModerateReviewDto, ReplyReviewDto, ReviewQueryDto } from './dto/review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Public reviews for a vendor' })
  vendorReviews(@Param('vendorId') vendorId: string, @Query() query: ReviewQueryDto) {
    return this.reviews.listForVendor(vendorId, query);
  }

  @ApiBearerAuth('access-token')
  @Roles('customer')
  @Post()
  @ApiOperation({ summary: 'Review a completed booking (verified purchase)' })
  create(@CurrentUser('id') customerId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(customerId, dto);
  }

  @ApiBearerAuth('access-token')
  @Roles('customer')
  @Get('mine')
  @ApiOperation({ summary: 'My submitted reviews' })
  mine(@CurrentUser('id') customerId: string, @Query() query: ReviewQueryDto) {
    return this.reviews.listMine(customerId, query);
  }

  @ApiBearerAuth('access-token')
  @Roles('vendor', 'admin')
  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply publicly as the vendor' })
  reply(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReplyReviewDto) {
    return this.reviews.reply(user, id, dto);
  }

  @ApiBearerAuth('access-token')
  @Roles('vendor', 'admin')
  @Get('vendor')
  @ApiOperation({ summary: 'Reviews for my business (vendor workspace)' })
  myVendorReviews(@CurrentUser() user: AuthUser, @Query() query: ReviewQueryDto) {
    return this.reviews.listForVendor(query.vendorId ?? user.vendorId ?? '__none__', query);
  }

  @ApiBearerAuth('access-token')
  @Roles('admin')
  @Get('admin')
  @ApiOperation({ summary: 'Moderation queue for all reviews' })
  adminList(@Query() query: ReviewQueryDto) {
    return this.reviews.adminList(query);
  }

  @ApiBearerAuth('access-token')
  @Roles('admin')
  @Get('admin/stats')
  @ApiOperation({ summary: 'Review moderation counters' })
  stats() {
    return this.reviews.stats();
  }

  @ApiBearerAuth('access-token')
  @Roles('admin')
  @Patch(':id/moderate')
  @ApiOperation({ summary: 'Publish, hide or flag a review' })
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviews.moderate(id, dto);
  }
}
