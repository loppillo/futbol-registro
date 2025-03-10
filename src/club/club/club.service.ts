import { Injectable } from '@nestjs/common';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Region } from 'src/region/region/entities/region.entity';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ClubService {
  constructor( @InjectRepository(Club) private readonly clubRepo: Repository<Club>,
  @InjectRepository(Region) private readonly regionRepo: Repository<Region>,
    @InjectRepository(Asociacion) private readonly associationRepo: Repository<Asociacion>,

){}




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

  async importClubsFromExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
  
    if (data.length === 0) {
      console.warn('El archivo Excel está vacío.');
      return { message: 'No hay registros para importar.' };
    }
  
    for (const [index, row] of data.entries()) {
      try {
        // Validar que los campos necesarios existan en cada fila
        const requiredFields = ['region', 'asociacion', 'club'];
        const missingFields = requiredFields.filter(field => !row[field]);
  
        if (missingFields.length) {
          console.warn(`Fila ${index + 1}: Faltan campos esenciales: ${missingFields.join(', ')}`);
          continue;
        }
  
        console.log(`Procesando fila ${index + 1}: ${JSON.stringify(row)}`);
  
        // Buscar región por nombre
        const region = await this.regionRepo.findOne({ where: { name: row['region'] } });
        if (!region) {
          console.warn(`Fila ${index + 1}: Región no encontrada: ${row['region']}`);
          continue;
        }
  
        // Buscar asociación vinculada a la región
        const asociacion = await this.associationRepo.findOne({
          where: {
            name: row['asociacion'], // Busca por nombre de la asociación
            region: { id: region.id }, // Relación con la región
          },
        });
        if (!asociacion) {
          console.warn(`Fila ${index + 1}: Asociación no encontrada en la región: ${row['asociacion']}`);
          continue;
        }
  
        // Verificar si el club ya existe
        let club = await this.clubRepo.findOne({ where: { name: row['club'], asociacion: {id:asociacion.id }} });
        if (club) {
          console.log(`Fila ${index + 1}: El club ya existe: ${row['club']}`);
          continue;
        }
  
        // Crear nuevo club
        club = this.clubRepo.create({
          name: row['club'],
          asociacion: asociacion, // Relación con la asociación
        });
  
        // Guardar club en la base de datos
        await this.clubRepo.save(club);
        console.log(`Fila ${index + 1}: Club guardado exitosamente: ${club.name}`);
      } catch (error) {
        console.error(`Error en fila ${index + 1}: ${error.message}`);
      }
    }
  
    return { message: 'Importación completada exitosamente' };
  }
  
}
