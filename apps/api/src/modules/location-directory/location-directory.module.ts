import { Module } from '@nestjs/common';
import { LocationDirectoryService } from './location-directory.service';
import { LocationDirectoryController } from './location-directory.controller';
import { AdminLocationDirectoryController } from './admin-location-directory.controller';

@Module({
  controllers: [LocationDirectoryController, AdminLocationDirectoryController],
  providers: [LocationDirectoryService],
  exports: [LocationDirectoryService],
})
export class LocationDirectoryModule {}
