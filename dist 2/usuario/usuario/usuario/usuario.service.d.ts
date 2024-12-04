import { Repository } from 'typeorm';
import { User } from './entities/usuario.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    create(userData: Partial<User>): Promise<User>;
    findOneByEmail(email: string): Promise<User>;
    findByEmailWithPassword(email: string): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: number): string;
    remove(id: number): string;
}
