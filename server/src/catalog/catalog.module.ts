import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CategoriesController, ServicesController, VendorsController } from './catalog.controller';

@Module({
  providers: [CatalogService],
  controllers: [CategoriesController, VendorsController, ServicesController],
  exports: [CatalogService],
})
export class CatalogModule {}
