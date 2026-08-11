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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME')!,
        password: configService.get<string>('DB_PASSWORD')!,
        database: configService.get<string>('DB_DATABASE')!,
        autoLoadEntities: true,
        synchronize: false,
        extra: {
          // Mantener vivas las conexiones del pool
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          // Limitar el pool de conexiones
          connectionLimit: 10,
        },   // Permitir múltiples declaraciones en una consulta

      }),

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
export class AppModule { }
