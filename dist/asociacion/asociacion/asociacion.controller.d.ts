import { AsociacionService } from './asociacion.service';
import { Asociacion } from './entities/asociacion.entity';
export declare class AsociacionController {
    private readonly asociacionService;
    constructor(asociacionService: AsociacionService);
    findAll(): Promise<Asociacion[]>;
    create(asociacionData: Partial<Asociacion>): Promise<Asociacion>;
    update(id: number, data: Partial<Asociacion>): Promise<Asociacion>;
    delete(id: number): Promise<void>;
}
