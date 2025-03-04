import { Injectable } from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Repository } from 'typeorm/repository/Repository';
import { Region } from './entities/region.entity';
import { InjectRepository } from '@nestjs/typeorm';



@Injectable()
export class RegionService {

  constructor( @InjectRepository(Region) private readonly regionRepo: Repository<Region>){}

  
  async findAll() {
    return this.regionRepo.find();
  }

  async create(data: CreateRegionDto): Promise<Region> {
    console.log('Datos recibidos:', data);
   
  
    const region = this.regionRepo.create(data);
    console.log('Objeto Region antes de guardar:', region);
  
    const savedRegion = await this.regionRepo.save(region);
    console.log('Región guardada:', savedRegion);
  
    return savedRegion;
  }
  
  async update(id: number, data: Partial<Region>): Promise<Region> {
    await this.regionRepo.update(id, data);
    return this.regionRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.regionRepo.delete(id);
  }

  async bulkCreate(regions: CreateRegionDto[]): Promise<void> {
    const newRegions = regions.map((region) =>
      this.regionRepo.create({ name: region.name }),
    );

    await this.regionRepo.save(newRegions);
  }

  async findRegionById(id: number): Promise<Region | undefined> {
    return await this.regionRepo.findOne({ where: { id } });
  }



}
