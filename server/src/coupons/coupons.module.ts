import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { AdminCouponsController, CouponsController } from './coupons.controller';

@Module({
  providers: [CouponsService],
  controllers: [CouponsController, AdminCouponsController],
  exports: [CouponsService],
})
export class CouponsModule {}
