import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { CatalogService } from './catalog.service';
import { ServiceQueryDto, VendorQueryDto } from './dto/catalog.dto';

@ApiTags('Catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active categories with live counts' })
  list() {
    return this.catalog.categories();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Category detail with featured services' })
  detail(@Param('slug') slug: string) {
    return this.catalog.category(slug);
  }
}

@ApiTags('Catalog')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search verified vendors' })
  list(@Query() query: VendorQueryDto) {
    return this.catalog.vendors(query);
  }

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'Cities with active vendors' })
  cities() {
    return this.catalog.cities();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Public vendor storefront' })
  detail(@Param('slug') slug: string) {
    return this.catalog.vendor(slug);
  }

  @Public()
  @Get(':slug/services')
  @ApiOperation({ summary: 'Published services for a vendor' })
  services(@Param('slug') slug: string) {
    return this.catalog.vendorServices(slug);
  }
}

@ApiTags('Catalog')
@Controller('services')
export class ServicesController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search published services' })
  list(@Query() query: ServiceQueryDto) {
    return this.catalog.services(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Service detail with add-ons, questions and reviews' })
  detail(@Param('slug') slug: string) {
    return this.catalog.service(slug);
  }
}
