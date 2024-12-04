import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Jugador } from './entities/jugador.entity';

// Asegúrate de que AuthModule esté correctamente importado
import { MulterModule } from '@nestjs/platform-express';

import { APP_GUARD } from '@nestjs/core';
import { Club } from 'src/club/club/entities/club.entity';
import { Region } from 'src/region/region/entities/region.entity';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';

import { JugadoresController } from './jugador.controller';
import { JugadoresService } from './jugador.service';




@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador]),
    TypeOrmModule.forFeature([Club]),
    TypeOrmModule.forFeature([Region]),
    TypeOrmModule.forFeature([Asociacion]),

    MulterModule.register({
      dest: './uploads',
      limits: { fileSize: 10 * 1024 * 1024 }, // Limitar tamaño a 10MB
    }),
  ],
  controllers: [JugadoresController],
  providers: [
    JugadoresService,
   
   
  ],
})
export class JugadorModule {}


