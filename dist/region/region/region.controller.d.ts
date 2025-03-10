import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
export declare class RegionController {
    private readonly regionService;
    constructor(regionService: RegionService);
    create(createRegionDto: CreateRegionDto): Promise<import("./entities/region.entity").Region>;
    findAll(): Promise<import("./entities/region.entity").Region[]>;
    obtenerRPorId(id: number): Promise<import("./entities/region.entity").Region>;
    update(id: string, updateRegionDto: UpdateRegionDto): Promise<import("./entities/region.entity").Region>;
    remove(id: string): Promise<void>;
    bulkCreate(file: Express.Multer.File): Promise<{
        message: string;
        data: unknown[];
    }>;
}
