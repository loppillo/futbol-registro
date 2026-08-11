import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';


import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { UsersService } from 'src/usuario/usuario/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Region } from 'src/region/region/entities/region.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Region) private readonly regionRepository: Repository<Region>,
  ) {}

  async register({ name, email, password, regionId, role }: RegisterDto) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (user) {
      throw new BadRequestException('User already exists');
    }
  
    // Obtener la región desde la base de datos
    const region = await this.regionRepository.findOne({ where: { id: regionId } });
    if (!region) {
      throw new BadRequestException('Region not found');
    }
  
    // Crear un nuevo usuario con la región y el rol
    const newUser = await this.usersService.create({
      name,
      email,
      password: await bcryptjs.hash(password, 10),
      region, // Asigna el objeto region
      role,
    });
  
    return {
      name: newUser.name,
      email: newUser.email,
      region: newUser.region.name, // Devuelve el nombre de la región
      role: newUser.role,
    };
  }
  
// auth.service.ts
async login({ email, password }: LoginDto) {
  const user = await this.usersService.findByEmailWithPassword(email);
  
  if (!user) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  // Incluimos tanto el ID de la región como el Nombre en el payload
  const payload = { 
    sub: user.id,
    email: user.email, 
    role: user.role, 
    regionId: user.region?.id, 
    region: user.region?.name 
  };

  const token = await this.jwtService.signAsync(payload);

  return {
    access_token: token,
    email: user.email,
    role: user.role,
    regionId: user.region?.id,
    region: user.region?.name,
  };
}
  
  async profile({ email, role }: { email: string; role: string }) {
    return await this.usersService.findOneByEmail(email);
  }
}

