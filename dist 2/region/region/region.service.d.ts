import { CreateRegionDto } from './dto/create-region.dto';
import { Repository } from 'typeorm/repository/Repository';
import { Region } from './entities/region.entity';
export declare class RegionService {
    private readonly regionRepo;
    constructor(regionRepo: Repository<Region>);
    findAll(): Promise<Region[]>;
    create(data: CreateRegionDto): Promise<Region>;
    update(id: number, data: Partial<Region>): Promise<Region>;
    delete(id: number): Promise<void>;
    bulkCreate(regions: CreateRegionDto[]): Promise<void>;
    findRegionById(id: number): Promise<Region | undefined>;
}
