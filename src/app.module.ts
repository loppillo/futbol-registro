import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JugadorModule } from './jugador/jugador/jugador.module';
import { Jugador } from './jugador/jugador/entities/jugador.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './usuario/usuario/usuario/entities/usuario.entity';

import { UsuarioModule } from './usuario/usuario/usuario/usuario.module';

import { AsociacionModule } from './asociacion/asociacion/asociacion.module';
import { ClubModule } from './club/club/club.module';
import { RegionModule } from './region/region/region.module';
import { Club } from './club/club/entities/club.entity';
import { Asociacion } from './asociacion/asociacion/entities/asociacion.entity';
import { Region } from './region/region/entities/region.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '162.241.61.254',
      port: 3306,
      username: 'fenfurna_lopo',     // Cambiar según tu configuración
      password: 'b&jTYe?&t^S!', // Cambiar según tu configuración
      database: 'fenfurna_futbol_db',
      entities: [Jugador,User,Club, Asociacion, Region],  // Todas las entidades que usaremos
      synchronize: true, 
      connectTimeout: 10000,
      multipleStatements: true,   // Permitir múltiples declaraciones en una consulta
    }),

    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles globalmente
     envFilePath: './.env', // Selecciona el archivo .env basado en el entorno
    }),
    JugadorModule,
    UsuarioModule,
    AsociacionModule,
    ClubModule,
    RegionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
