import { Module } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { AdminPayoutsController, VendorPayoutsController } from './payouts.controller';

@Module({
  providers: [PayoutsService],
  controllers: [VendorPayoutsController, AdminPayoutsController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
