import { Repository } from 'typeorm';
import { User } from './entities/usuario.entity';
export declare class UserRepository extends Repository<User> {
    findByNombre(nombre: string): Promise<User[]>;
}
