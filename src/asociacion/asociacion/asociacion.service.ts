import { Injectable } from '@nestjs/common';
import { CreateAsociacionDto } from './dto/create-asociacion.dto';
import { UpdateAsociacionDto } from './dto/update-asociacion.dto';
import { Asociacion } from './entities/asociacion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AsociacionService {

  constructor( @InjectRepository(Asociacion) private readonly asociacionRepo: Repository<Asociacion>){}

 

  async findAll(): Promise<Asociacion[]> {
    return this.asociacionRepo.find({ relations: ['region'] });
  }
  async create(data: Partial<Asociacion>): Promise<Asociacion> {
    const asociacion = this.asociacionRepo.create(data);
    return this.asociacionRepo.save(asociacion);
  }

  async update(id: number, data: Partial<Asociacion>): Promise<Asociacion> {
    await this.asociacionRepo.update(id, data);
    return this.asociacionRepo.findOneBy({ id });
  }

  async delete(id: number): Promise<void> {
    await this.asociacionRepo.delete(id);
  }
}
