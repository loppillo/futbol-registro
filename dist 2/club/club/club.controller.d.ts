import { ClubService } from './club.service';
import { Club } from './entities/club.entity';
export declare class ClubController {
    private readonly clubService;
    constructor(clubService: ClubService);
    findAll(): Promise<Club[]>;
    create(clubData: Partial<Club>): Promise<Club>;
    update(id: number, data: Partial<Club>): Promise<Club>;
    delete(id: number): Promise<void>;
}
