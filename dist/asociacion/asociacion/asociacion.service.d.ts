import { Asociacion } from './entities/asociacion.entity';
import { Repository } from 'typeorm';
export declare class AsociacionService {
    private readonly asociacionRepo;
    constructor(asociacionRepo: Repository<Asociacion>);
    findAll(): Promise<Asociacion[]>;
    create(data: Partial<Asociacion>): Promise<Asociacion>;
    update(id: number, data: Partial<Asociacion>): Promise<Asociacion>;
    delete(id: number): Promise<void>;
}
