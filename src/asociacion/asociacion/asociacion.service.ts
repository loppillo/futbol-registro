import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAsociacionDto } from './dto/create-asociacion.dto';
import { UpdateAsociacionDto } from './dto/update-asociacion.dto';
import { Asociacion } from './entities/asociacion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from 'src/region/region/entities/region.entity';

@Injectable()
export class AsociacionService {

  constructor(@InjectRepository(Asociacion) private readonly asociacionRepo: Repository<Asociacion>) { }



  async findAll(): Promise<Asociacion[]> {
    return this.asociacionRepo.find({ relations: ['region'] });
  }
async create(data: Partial<Asociacion>): Promise<Asociacion> {
  // 1. Mapea regionId como objeto de relación si viene como ID numérico
  if (data['regionId'] && !data.region) {
    data.region = { id: Number(data['regionId']) } as Region;
  }

  // 2. Guarda el registro en la base de datos
  const nuevaAsociacion = await this.asociacionRepo.save(
    this.asociacionRepo.create(data),
  );

  // 3. Retorna el registro recargado con la relación 'region'
  return this.asociacionRepo.findOne({
    where: { id: nuevaAsociacion.id },
    relations: ['region'],
  });
}
  async update(id: number, data: any): Promise<Asociacion> {
    const asociacion = await this.asociacionRepo.findOneBy({ id });
    if (!asociacion) {
      throw new NotFoundException(`Asociación con ID ${id} no encontrada`);
    }

    // Extraemos regionId si viene en la data
    const { regionId, ...restData } = data;

    // Asignamos las propiedades básicas
    Object.assign(asociacion, restData);

    // Si enviaron regionId, asignamos la relación como objeto
    if (regionId) {
      asociacion.region = { id: regionId } as any;
    }

    // .save() gestiona correctamente la actualización de la FK
    return await this.asociacionRepo.save(asociacion);
  }

  async delete(id: number): Promise<void> {
    await this.asociacionRepo.delete(id);
  }
}
