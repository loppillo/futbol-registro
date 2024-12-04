import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { Jugador } from './entities/jugador.entity';
import { PaginationDto } from './dto/PaginationDto.dto';
import { JugadorResponseDto } from './dto/JugadorResponseDto.dto';
import { PaginatedResponseDto } from './entities/PaginatedResponseDto.dto';
import { Club } from 'src/club/club/entities/club.entity';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Region } from 'src/region/region/entities/region.entity';
import * as XLSX from 'xlsx';
import { levenshtein } from 'fast-levenshtein';
import { format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';
export interface ClubData {
  club: string;
  association?: string;
  region?: string;
}



@Injectable()
export class JugadoresService {
  private threshold = 10;


  constructor(
    @InjectRepository(Region) private readonly regionRepo: Repository<Region>,
    @InjectRepository(Asociacion) private readonly associationRepo: Repository<Asociacion>,
    @InjectRepository(Club) private readonly clubRepo: Repository<Club>,
    @InjectRepository(Jugador) private readonly jugadoresRepository: Repository<Jugador>,
  ) {}

  


  
  async create(createJugadorDto: CreateJugadorDto): Promise<Jugador> {
    const { rut, clubId, nombre, paterno, materno, fecha_nacimiento, fecha_inscripcion, foto, recalificado } = createJugadorDto;

    // Validar clubId como número entero
    const clubIdNumber = parseInt(clubId.toString(), 10);
    if (isNaN(clubIdNumber)) {
      throw new BadRequestException('El clubId es inválido o no es un número.');
    }

    // Verificar si ya existe un jugador con el mismo RUT
    const jugadorExistente = await this.jugadoresRepository.findOne({ where: { rut } });
    if (jugadorExistente) {
      throw new ConflictException('El jugador con este RUT ya existe.');
    }

    // Buscar el club relacionado por id
    const club = await this.clubRepo.findOne({ where: { id: clubIdNumber } });
    if (!club) {
      throw new NotFoundException('El club especificado no existe.');
    }



    // Crear el nuevo jugador
    const nuevoJugador = this.jugadoresRepository.create({
      rut,
      nombre,
      paterno,
      materno,
      fecha_nacimiento,
      fecha_inscripcion,
      foto: null, // Asignar la ruta de la foto
      recalificado,
      club, // Asignar club relacionado
    });

    // Guardar en la base de datos y devolver el jugador creado
    return this.jugadoresRepository.save(nuevoJugador);
  }

  
  async obtenerJugadorPorId(id: number): Promise<Jugador> {
    const jugador = await this.jugadoresRepository.findOne({ where: { id } });

    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }

    return jugador;
  }



  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ players: JugadorResponseDto[]; total: number }> {
    const { page, limit } = paginationDto;
  
    const [players, total] = await this.jugadoresRepository.createQueryBuilder('jugador')
  .leftJoinAndSelect('jugador.club', 'club')
  .leftJoinAndSelect('club.asociacion', 'asociacion')
  .leftJoinAndSelect('asociacion.region', 'region')
  .where('jugador.duplicado = :duplicado', { duplicado: false })
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();

   const playersDto = players.map(player => ({
  id: player.id,
  paterno: player.paterno,
  materno: player.materno,
  nombre: player.nombre,
  rut: player.rut,
  fecha_nacimiento: player.fecha_nacimiento,
  fecha_inscripcion: player.fecha_inscripcion,
  club: player.club ? {
    id: player.club.id,
    name: player.club.name,
    asociacion: player.club.asociacion ? {
      id: player.club.asociacion.id,
      name: player.club.asociacion.name,
      region: player.club.asociacion.region ? {
        id: player.club.asociacion.region.id,
        name: player.club.asociacion.region.name,
      } : null, // Asignar null si la región es null
    } : null, // Asignar null si la asociación es null
  } : null, // Asignar null si el club es null
  sancionado: player.sancionado,
  recalificado:player.recalificado,
  duplicado: Boolean(player.duplicado), // Conversión de number a boolean
}));

  
    // Retornar jugadores y el total
    return {
      players: playersDto,
      total,
    };
  }
  
  
  

  async findOne(id: number): Promise<Jugador> {
    const jugador = await this.jugadoresRepository.findOneBy({ id });
    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado.`);
    }
    return jugador;
  }

  async update(id: number, updateJugadorDto: UpdateJugadorDto): Promise<Jugador> {
   
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const jugador = await this.findOne(id);
    await this.jugadoresRepository.remove(jugador);
  }

  // Function to convert Excel date to 'YYYY-MM-DD' format
private convertirFechaExcel(fechaExcel: number): string {
  const fechaBase = new Date(1900, 0, fechaExcel - 1); // Base date in Excel
  fechaBase.setDate(fechaBase.getDate() + 1); // Adjust for Excel's date system
  return fechaBase.toISOString().split('T')[0]; // Return in 'YYYY-MM-DD' format
}

// Import function with date conversion and duplicate marking
async importarJugadores(jugadores: any[]): Promise<any> {
  const errores = [];
  const jugadoresGuardados = [];

  for (const jugador of jugadores) {
    const {
      id,
      paterno,
      materno,
      nombre,
      rut,
      fecha_nacimiento,
      club_deportivo,
      asociacion,
      fecha_inscripcion
    } = jugador;

    // Convert dates if in Excel format (numeric)
    const fechaNacimientoValida = typeof fecha_nacimiento === 'number'
      ? this.convertirFechaExcel(fecha_nacimiento)
      : fecha_nacimiento;

    const fechaInscripcionValida = 
      typeof fecha_inscripcion === 'number'
        ? this.convertirFechaExcel(fecha_inscripcion)
        : fecha_inscripcion || '2024-08-20';

    // Check if the player already exists by RUT
    const jugadorExistente = await this.jugadoresRepository.findOne({ where: { rut } });

  

  }

  // After importing, mark additional duplicates found in the entire database
  await this.markDuplicates();

  return {
    jugadoresGuardados,
    errores,
  };
}

// Function to mark duplicates in the database
async markDuplicates() {
  try {
    // Get all players grouped by RUT with duplicates
    const players = await this.jugadoresRepository
      .createQueryBuilder("jugador")
      .select("jugador.rut")
      .addSelect("COUNT(jugador.id)", "count")
      .groupBy("jugador.rut")
      .having("COUNT(jugador.id) > 1")
      .getRawMany();

    // Extract RUTs of duplicate players
    const duplicateRuts = players.map((player) => player.rut);

    if (duplicateRuts.length > 0) {
      // Set `duplicado` to 1 for players with duplicate RUTs
      await this.jugadoresRepository
        .createQueryBuilder()
        .update(Jugador)
        .set({ duplicado: 1 })
        .where("rut IN (:...duplicateRuts)", { duplicateRuts })
        .execute();
    }

    return { message: `Marked ${duplicateRuts.length} duplicate RUTs.`, duplicates: duplicateRuts };
  } catch (error) {
    console.error("Error marking duplicates:", error);
    throw new Error("Failed to mark duplicate players.");
  }
}


   // Buscar jugador por RUT
   async buscarPorRut(rut: string): Promise<Jugador | null> {
    // Buscar jugador con relaciones necesarias
    const jugador = await this.jugadoresRepository.findOne({
      where: { rut },
      relations: ['club', 'club.asociacion', 'club.asociacion.region'], // Incluir relaciones necesarias
    });
  
    // Si el jugador tiene una foto, construir la URL completa
    if (jugador && jugador.foto) {
      jugador.foto = `${process.env.BASE_URL}/${jugador.foto}`; // Construir la URL completa
    }
  
    return jugador;
  }
  

  async buscarPorClub(club_deportivo: string, regionName: string): Promise<Jugador[]> {
    const jugadores = await this.jugadoresRepository
      .createQueryBuilder('jugador')
      .leftJoinAndSelect('jugador.club', 'club')
      .leftJoinAndSelect('club.asociacion', 'asociacion')
      .leftJoinAndSelect('asociacion.region', 'region')
      .where('club.name = :club_deportivo', { club_deportivo })
      .andWhere('region.name = :regionName', { regionName })  // Usamos 'region.name' en vez de 'region.id'
      .getMany();
  
    return jugadores;
  }
  



  async findAllPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [jugadores, total] = await this.jugadoresRepository.findAndCount({
      skip: skip,
      take: limit,
    });

    return {
      data: jugadores,
      total,
      page,
      pageSize: limit,
    };
  }

  async updatePlayerImage(playerId: number, imagePath: string): Promise<Jugador> {
    const player = await this.jugadoresRepository.findOne({ where: { id: playerId } });
    if (player) {
      player.foto = imagePath;  // Guarda solo la ruta relativa
      return await this.jugadoresRepository.save(player);
    }
    throw new NotFoundException('Jugador no encontrado');
  }

  async createProductWithImage(id: number, foto: string) {

    const player = await this.jugadoresRepository.findOne({ where: { id: id } });
    if (!player) {
      throw new Error('Jugador no encontrado'); // Maneja el caso de error si el jugador no existe
    }

  
    player.foto = foto;
    return await this.jugadoresRepository.save(player);
  }

  async findPlayerById(id: number): Promise<Jugador> {
    const player = await this.jugadoresRepository.findOne({ where: { id: id } });

    if (!player) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }

    return player;
  }

  async findAllPlayers(): Promise<Jugador[]> {
    return await this.jugadoresRepository.find();
  }

  async createPlayer(createPlayerDto: CreateJugadorDto , imagePath?: string ): Promise<Jugador> {
    const jugadorExistente = await this.jugadoresRepository.findOneBy({
      rut: createPlayerDto.rut,
    });

    if (jugadorExistente) {
      throw new Error('El jugador con este RUT ya existe.');
    }
    
    // If you're storing the imagePath in the database, make sure your Jugador entity includes it
    const newPlayer = this.jugadoresRepository.create(createPlayerDto);
    if (imagePath) {
      newPlayer.foto = imagePath;
    }
    return await this.jugadoresRepository.save(newPlayer);
  }

  async updatePlayer(id: number, updatePlayerDto: UpdateJugadorDto): Promise<Jugador> {
    const playerToUpdate = await this.jugadoresRepository.findOne({ where: { id } }); // Use the options object
    if (!playerToUpdate) {
        throw new NotFoundException('Player not found');
    }

    // Update player fields
    Object.assign(playerToUpdate, updatePlayerDto);
    return await this.jugadoresRepository.save(playerToUpdate);





  
}




async updatePlay(
  id: number,
  updatePlayerDto: Partial<UpdateJugadorDto>, // Asegura que sea parcial
  imagePath?: string
): Promise<Jugador> {
  const playerToUpdate = await this.jugadoresRepository.findOne({ where: { id } });
  if (!playerToUpdate) {
    throw new NotFoundException('Jugador no encontrado');
  }

  // Filtra las propiedades permitidas manualmente
  const allowedFields = ['nombre', 'paterno', 'materno', 'rut', 'fecha_nacimiento', 'fecha_inscripcion', 'sancionado'];
  const filteredDto = Object.keys(updatePlayerDto)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updatePlayerDto[key];
      return obj;
    }, {});

  // Formatea las fechas como string si existen
  if (filteredDto['fecha_nacimiento']) {
    filteredDto['fecha_nacimiento'] = format(new Date(filteredDto['fecha_nacimiento']), 'yyyy-MM-dd');
  }
  if (filteredDto['fecha_inscripcion']) {
    filteredDto['fecha_inscripcion'] = format(new Date(filteredDto['fecha_inscripcion']), 'yyyy-MM-dd');
  }

  // Asignar propiedades filtradas
  Object.assign(playerToUpdate, filteredDto);

  // Actualizar imagen si se proporciona
  if (imagePath) {
    playerToUpdate.foto = imagePath;
  }

  return this.jugadoresRepository.save(playerToUpdate);
}









async getAllPlayers(paginationDto: PaginationDto){
  const { page, limit } = paginationDto;

  // Calcula el desplazamiento
  const skip = (page - 1) * limit;

  // Usa findAndCount para obtener los jugadores y el total de registros
  const [players, total] = await this.jugadoresRepository.findAndCount({
    skip,
    take: limit,
  });

  // Mapea los jugadores a un DTO que incluya la ruta de la imagen
 /*
  const playerResponses: JugadorResponseDto[] = players.map(player => ({
    id: player.id,
    nombre: player.nombre,
    paterno: player.paterno,
    materno: player.materno,
    rut:player.rut,
    fecha_nacimiento: player.fecha_nacimiento,
    club_deportivo: player.club_deportivo,
    asociacion: player.asociacion,
    fecha_inscripcion: player.fecha_inscripcion,
    foto: player.foto ? `http://localhost:3000/${player.foto}` : null,
  }));
*/
  // Calcula el total de páginas
  const totalPages = Math.ceil(total / limit);

}


async obtenerDuplicados(page: number = 1, limit: number = 10) {
  const [jugadores, total] = await this.jugadoresRepository.findAndCount({
    where: { duplicado: 1 },
    relations: [
      'club', // Relación con el club
      'club.asociacion', // Relación con la asociación
      'club.asociacion.region', // Relación con la región
    ],
    take: limit,
    skip: (page - 1) * limit,
  });

  const formattedJugadores = jugadores.map((jugador) => ({
    id: jugador.id,
    nombre: jugador.nombre,
    paterno: jugador.paterno,
    materno: jugador.materno,
    rut: jugador.rut,
    fecha_nacimiento: jugador.fecha_nacimiento,
    fecha_inscripcion: jugador.fecha_inscripcion,
    club: {
      id: jugador.club.id,
      name: jugador.club.name,
      asociacion: {
        id: jugador.club.asociacion.id,
        name: jugador.club.asociacion.name,
        region: {
          id: jugador.club.asociacion.region.id,
          name: jugador.club.asociacion.region.name,
        },
      },
    },
    sancionado: jugador.sancionado,
    duplicado: jugador.duplicado,
  }));

  return {
    jugadores: formattedJugadores,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

async importFromExcel(filePath: string) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  if (data.length === 0) {
    console.warn('El archivo Excel está vacío.');
    return { message: 'No hay registros para importar.' };
  }

  // Función para convertir fechas en formato numérico de Excel
  const convertirFechaExcel = (excelDate: number): Date => {
    const epoch = new Date(1900, 0, 1); // El 1 de enero de 1900 es la fecha base de Excel
    epoch.setDate(epoch.getDate() + excelDate - 2); // Excel empieza el conteo desde 1, pero tiene un desfase con el año 1900
    return epoch;
  };

  for (const [index, row] of data.entries()) {
    try {
      // Validación de datos esenciales
      const requiredFields = ['paterno', 'materno', 'nombre', 'rut', 'club_deportivo', 'fecha_nacimiento', 'fecha_inscripcion'];
      const missingFields = requiredFields.filter(field => !row[field]);

      if (missingFields.length) {
        console.warn(`Fila ${index + 1}: Faltan campos esenciales: ${missingFields.join(', ')}`);
        continue;
      }

      console.log(`Procesando fila ${index + 1}: ${JSON.stringify(row)}`);

      // Convertir fechas si están en formato Excel numérico
      const fechaNacimientoValida = typeof row['fecha_nacimiento'] === 'number'
        ? convertirFechaExcel(row['fecha_nacimiento'])
        : row['fecha_nacimiento'];

      const fechaInscripcionValida = 
        typeof row['fecha_inscripcion'] === 'number'
          ? convertirFechaExcel(row['fecha_inscripcion'])
          : row['fecha_inscripcion'] || '2023-08-20'; // Fecha por defecto si no hay inscripción

      // Si alguna fecha es inválida, asignar fecha predeterminada
      if (isNaN(fechaNacimientoValida.getTime())) {
        console.warn(`Fila ${index + 1}: Fecha de nacimiento inválida. Fecha de nacimiento: ${row['fecha_nacimiento']}`);
        continue;
      }

      let fechaInscripcion: Date;
      try {
        // Si la fecha de inscripción es inválida, asignar la fecha predeterminada
        fechaInscripcion = fechaInscripcionValida instanceof Date ? fechaInscripcionValida : new Date(2023, 8, 20);  // 20 de septiembre de 2023
      } catch (error) {
        console.error(`Fila ${index + 1}: Error procesando fecha de inscripción - ${error.message}`);
        continue;
      }

      // Buscar región, asociación y club en paralelo
      const [region, asociacion, club] = await Promise.all([
        this.regionRepo.findOne({ where: { name: row['region'] } }),
        this.associationRepo.findOne({ where: { name: row['asociacion'] } }),
        this.clubRepo.findOne({ where: { name: row['club_deportivo'] } }),
      ]);

      if (!region) {
        console.warn(`Fila ${index + 1}: Región no encontrada: ${row['region']}`);
        continue;
      }

      if (!asociacion) {
        console.warn(`Fila ${index + 1}: Asociación no encontrada: ${row['asociacion']}`);
        continue;
      }

      if (!club) {
        console.warn(`Fila ${index + 1}: Club no encontrado: ${row['club_deportivo']}`);
        continue;
      }

      // Crear jugador
      const player = this.jugadoresRepository.create({
        paterno: row['paterno'],
        materno: row['materno'],
        nombre: row['nombre'],
        rut: row['rut'],
        fecha_nacimiento: fechaNacimientoValida,
        fecha_inscripcion: fechaInscripcion,
        foto: null,
        recalificado:false,
        sancionado: false,
        duplicado: 0,
        club,
      });

      // Guardar jugador
      await this.jugadoresRepository.save(player);
      console.log(`Jugador guardado exitosamente: ${player.nombre}`);
    } catch (error) {
      console.error(`Error en fila ${index + 1}: ${error.message}`);
    }
  }

  return { message: 'Importación completada exitosamente' };
}






processExcel(buffer: Buffer): { mainData: ClubData[]; referenceData: ClubData[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Nombrar las hojas explícitamente
  const mainSheetName = 'MainData';  // Nombre de la primera hoja
  const referenceSheetName = 'ReferenceData';  // Nombre de la segunda hoja

  // Verifica si las hojas existen en el libro
  if (!workbook.SheetNames.includes(mainSheetName) || !workbook.SheetNames.includes(referenceSheetName)) {
    throw new Error(`Las hojas '${mainSheetName}' o '${referenceSheetName}' no se encuentran en el archivo.`);
  }

  // Accede a las hojas por su nombre
  const mainSheet = workbook.Sheets[mainSheetName];
  const referenceSheet = workbook.Sheets[referenceSheetName];

  // Convierte las hojas a JSON
  const mainData: ClubData[] = XLSX.utils.sheet_to_json<ClubData>(mainSheet);
  const referenceData: ClubData[] = XLSX.utils.sheet_to_json<ClubData>(referenceSheet);

  // Verifica que los arrays no estén vacíos
  if (mainData.length === 0 || referenceData.length === 0) {
    throw new Error('Una de las hojas está vacía.');
  }

  return { mainData, referenceData };
}



fillMissingData(mainData: ClubData[], referenceData: ClubData[]): ClubData[] {
  // Verifica que los datos no estén vacíos
  if (!mainData || !referenceData || mainData.length === 0 || referenceData.length === 0) {
      throw new Error('No hay datos suficientes para completar la operación.');
  }

  // Crear un mapa para referencias exactas
  const referenceMap: Map<string, ClubData> = new Map();

  referenceData.forEach((ref) => {
    if (ref.club) {
      referenceMap.set(ref.club.toLowerCase(), ref);
    }
  });

  return mainData.map((record) => {
    if (!record.club) {
      return {
        ...record,
        association: 'No encontrado',
        region: 'No encontrado',
      };
    }

    const clubNameLower = record.club.toLowerCase();
    let matchedClub: ClubData | undefined = referenceMap.get(clubNameLower);

    // Si no hay coincidencia exacta, buscar coincidencias aproximadas
    if (!matchedClub) {
      matchedClub = this.findClosestMatch(record.club, referenceData);
    }

    if (matchedClub) {
      return {
        ...record,
        association: matchedClub.association,
        region: matchedClub.region,
      };
    }

    return {
      ...record,
      association: 'No encontrado',
      region: 'No encontrado',
    };
  });
}

private findClosestMatch(clubName: string, referenceData: ClubData[]): ClubData | null {
  let closestMatch: ClubData | null = null;
  let lowestDistance = this.threshold + 1;

  for (const reference of referenceData) {
    if (!reference.club) continue; // Asegúrate de que 'club' no sea undefined
    const distance = levenshtein.get(clubName.toLowerCase(), reference.club.toLowerCase());
    if (distance < lowestDistance) {
      closestMatch = reference;
      lowestDistance = distance;
    }
    // Si la distancia es 0, es una coincidencia exacta
    if (distance === 0) {
      break;
    }
  }

  return closestMatch || null; // Asegúrate de que siempre se retorne null si no hay coincidencias
}

async deletePlay(id: number): Promise<Jugador> {
  const playerToMark = await this.jugadoresRepository.findOne({ where: { id } });
  if (!playerToMark) {
    throw new NotFoundException('Jugador no encontrado');
  }

  // Marcar el jugador como duplicado
  playerToMark.duplicado = 1; // o true si el tipo es booleano

  return this.jugadoresRepository.save(playerToMark);
}

async updateJugadorPhoto(id: number, filePath: string): Promise<void> {
  // Encuentra el jugador por su ID
  const jugador = await this.jugadoresRepository.findOne({ where: { id } });
  
  if (!jugador) {
    throw new NotFoundException('Jugador no encontrado');
  }

  // Asignamos la ruta de la foto al campo 'foto' del jugador
  jugador.foto = filePath;
  
  // Guardamos el jugador con la nueva foto
  await this.jugadoresRepository.save(jugador);
}

}

