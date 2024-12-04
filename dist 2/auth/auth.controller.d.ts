import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        name: string;
        email: string;
        region: string;
        role: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        email: string;
        role: string;
        region: string;
    }>;
}
