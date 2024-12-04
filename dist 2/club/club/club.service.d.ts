import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
export declare class ClubService {
    private readonly clubRepo;
    constructor(clubRepo: Repository<Club>);
    findAll(): Promise<Club[]>;
    create(data: Partial<Club>): Promise<Club>;
    update(id: number, data: Partial<Club>): Promise<Club>;
    delete(id: number): Promise<void>;
}
