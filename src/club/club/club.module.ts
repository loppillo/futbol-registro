import { Module } from '@nestjs/common';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Jugador } from 'src/jugador/jugador/entities/jugador.entity';
import { Club } from './entities/club.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Asociacion]),TypeOrmModule.forFeature([Jugador]),TypeOrmModule.forFeature([Club]) ],
  controllers: [ClubController],
  providers: [ClubService],
})
export class ClubModule {}