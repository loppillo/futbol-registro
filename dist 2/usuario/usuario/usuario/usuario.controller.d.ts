import { CreateUserDto } from './dto/create-usuario.dto';
import { UsersService } from './usuario.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/usuario.entity").User>;
    findAll(): Promise<import("./entities/usuario.entity").User[]>;
    findOne(id: string): string;
    remove(id: string): string;
}
