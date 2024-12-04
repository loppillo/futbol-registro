import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { UsuarioModule } from 'src/usuario/usuario/usuario/usuario.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from 'src/region/region/entities/region.entity';


@Module({
  imports: [
    UsuarioModule,
    TypeOrmModule.forFeature([Region]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
