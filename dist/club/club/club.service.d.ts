import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { Region } from 'src/region/region/entities/region.entity';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
export declare class ClubService {
    private readonly clubRepo;
    private readonly regionRepo;
    private readonly associationRepo;
    constructor(clubRepo: Repository<Club>, regionRepo: Repository<Region>, associationRepo: Repository<Asociacion>);
    findAll(): Promise<Club[]>;
    create(data: Partial<Club>): Promise<Club>;
    update(id: number, data: Partial<Club>): Promise<Club>;
    delete(id: number): Promise<void>;
    importClubsFromExcel(filePath: string): Promise<{
        message: string;
    }>;
}
