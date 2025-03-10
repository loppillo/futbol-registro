import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/usuario/usuario/usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Region } from 'src/region/region/entities/region.entity';
import { Repository } from 'typeorm';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly regionRepository;
    constructor(usersService: UsersService, jwtService: JwtService, regionRepository: Repository<Region>);
    register({ name, email, password, regionId, role }: RegisterDto): Promise<{
        name: string;
        email: string;
        region: string;
        role: string;
    }>;
    login({ email, password }: LoginDto): Promise<{
        access_token: string;
        email: string;
        role: string;
        region: string;
    }>;
    profile({ email, role }: {
        email: string;
        role: string;
    }): Promise<import("../usuario/usuario/usuario/entities/usuario.entity").User>;
}
