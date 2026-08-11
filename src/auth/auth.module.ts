import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importar TypeOrmModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
// 👈 Importar la entidad Region
import { jwtConstants } from './constants';
import { UsuarioModule } from 'src/usuario/usuario/usuario/usuario.module';
import { Region } from 'src/region/region/entities/region.entity';

@Module({
  imports: [
    UsuarioModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' },
    }),
    TypeOrmModule.forFeature([Region]), // 👈 REGISTRAR AQUÍ LA ENTIDAD REGION
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule, JwtStrategy],
})
export class AuthModule {}