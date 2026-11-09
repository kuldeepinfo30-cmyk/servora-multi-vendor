import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { AddressDto, FavoriteDto, UpdateProfileDto } from './dto/user.dto';

@ApiTags('Customer')
@ApiBearerAuth('access-token')
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Customer dashboard counters' })
  stats(@CurrentUser('id') userId: string) {
    return this.users.stats(userId);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List my saved addresses' })
  addresses(@CurrentUser('id') userId: string) {
    return this.users.listAddresses(userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create an address' })
  createAddress(@CurrentUser('id') userId: string, @Body() dto: AddressDto) {
    return this.users.createAddress(userId, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  updateAddress(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: AddressDto) {
    return this.users.updateAddress(userId, id, dto);
  }

  @Post('addresses/:id/default')
  @ApiOperation({ summary: 'Make an address the default' })
  setDefault(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.users.setDefaultAddress(userId, id);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  removeAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.users.removeAddress(userId, id);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'List my saved services' })
  favorites(@CurrentUser('id') userId: string) {
    return this.users.listFavorites(userId);
  }

  @Post('favorites')
  @ApiOperation({ summary: 'Save a service or vendor' })
  addFavorite(@CurrentUser('id') userId: string, @Body() dto: FavoriteDto) {
    return this.users.addFavorite(userId, dto);
  }

  @Delete('favorites/:id')
  @ApiOperation({ summary: 'Remove a saved item' })
  removeFavorite(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.users.removeFavorite(userId, id);
  }
}
