import { Module } from '@nestjs/common';
import { AsociacionService } from './asociacion.service';
import { AsociacionController } from './asociacion.controller';
import { Region } from 'src/region/region/entities/region.entity';
import { Club } from 'src/club/club/entities/club.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asociacion } from './entities/asociacion.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Region]),TypeOrmModule.forFeature([Club]),TypeOrmModule.forFeature([Asociacion])],
  controllers: [AsociacionController],
  providers: [AsociacionService],
})
export class AsociacionModule {}
