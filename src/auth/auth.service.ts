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
  

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(email);
    
    if (!user) {
      throw new UnauthorizedException('email is wrong');
    }
  
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('password is wrong');
    }
  
    // Asegúrate de que 'region' contenga la información correcta
    const payload = { email: user.email, role: user.role, region: user.region?.name };
    const token = await this.jwtService.signAsync(payload);
  
    return {
      access_token:token,
      email: user.email,
      role: user.role, // Traer role desde el usuario registrado
      region: user.region?.name, // Traer el nombre de la región desde la relación
    };
  }
  
  async profile({ email, role }: { email: string; role: string }) {
    return await this.usersService.findOneByEmail(email);
  }
}

