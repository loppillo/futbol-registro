import { Injectable } from '@nestjs/common';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClubService {
  constructor( @InjectRepository(Club) private readonly clubRepo: Repository<Club>){}




  async findAll(): Promise<Club[]> {
    return this.clubRepo.find({ relations: ['asociacion'] });
  }

  async create(data: Partial<Club>): Promise<Club> {
    const club = this.clubRepo.create(data);
    return this.clubRepo.save(club);
  }

  async update(id: number, data: Partial<Club>): Promise<Club> {
    await this.clubRepo.update(id, data);
    return this.clubRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.clubRepo.delete(id);
  }
}
