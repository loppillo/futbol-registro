import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import * as levenshtein from 'fast-levenshtein';

import { Jugador } from './entities/jugador.entity';

import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Club } from 'src/club/club/entities/club.entity';
import { Region } from 'src/region/region/entities/region.entity';
import { PaginationDto } from './dto/PaginationDto.dto';


interface ClubData {
  club?: string;
  association?: string;
  region?: string;
}

@Injectable()
export class JugadoresService {
  private readonly logger = new Logger(JugadoresService.name);
  private readonly threshold = 10;

  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
    @InjectRepository(Asociacion)
    private readonly associationRepo: Repository<Asociacion>,
    @InjectRepository(Club)
    private readonly clubRepo: Repository<Club>,
    @InjectRepository(Jugador)
    private readonly jugadoresRepository: Repository<Jugador>,
    private readonly configService: ConfigService,
  ) { }

  // ==========================================
  // CREACIÓN Y EDICIÓN
  // ==========================================

  async createPlayer(
    createJugadorDto: CreateJugadorDto,
    file?: Express.Multer.File,
  ): Promise<Jugador> {
    const {
      rut,
      clubId,
      nombre,
      paterno,
      materno,
      fecha_nacimiento,
      fecha_inscripcion,
      recalificado,
    } = createJugadorDto;

    const rutNormalizado = this.normalizarFormatoRut(rut);
    const clubIdNumber = parseInt(clubId.toString(), 10);

    if (isNaN(clubIdNumber)) {
      throw new BadRequestException('El clubId es inválido o no es un número.');
    }

    const jugadorExistente = await this.jugadoresRepository.findOne({
      where: { rut: rutNormalizado },
    });

    if (jugadorExistente) {
      throw new ConflictException(
        `El jugador con el RUT ${rutNormalizado} ya se encuentra registrado.`,
      );
    }

    const club = await this.clubRepo.findOne({ where: { id: clubIdNumber } });
    if (!club) {
      throw new NotFoundException('El club especificado no existe.');
    }

    const fotoUrl = file ? `players/${file.filename}` : null;

    const nuevoJugador = this.jugadoresRepository.create({
      rut: rutNormalizado,
      nombre,
      paterno,
      materno,
      fecha_nacimiento,
      fecha_inscripcion,
      foto: fotoUrl,
      recalificado: Boolean(recalificado),
      duplicado: false,
      club,
    });

    return await this.jugadoresRepository.save(nuevoJugador);
  }

  async updatePlay(
    id: number,
    updateJugadorDto: Partial<UpdateJugadorDto>,
    file?: Express.Multer.File,
  ): Promise<Jugador> {
    const playerToUpdate = await this.jugadoresRepository.findOne({
      where: { id },
      relations: ['club', 'club.asociacion'],
    });

    if (!playerToUpdate) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }

    const {
      clubId,
      fecha_nacimiento,
      fecha_inscripcion,
      sancionado,
      recalificado,
      rut,
      ...demasCampos
    } = updateJugadorDto;

    Object.assign(playerToUpdate, demasCampos);

    if (rut) {
      playerToUpdate.rut = this.normalizarFormatoRut(rut);
    }

    if (fecha_nacimiento) {
      const nacStr = String(fecha_nacimiento);
      const strNacimiento = !nacStr.includes('T') ? `${nacStr}T12:00:00` : nacStr;
      const dateNacimiento = new Date(strNacimiento);
      if (!isNaN(dateNacimiento.getTime())) {
        playerToUpdate.fecha_nacimiento = dateNacimiento;
      }
    }

    if (fecha_inscripcion) {
      const inscStr = String(fecha_inscripcion);
      const strInscripcion = !inscStr.includes('T') ? `${inscStr}T12:00:00` : inscStr;
      const dateInscripcion = new Date(strInscripcion);
      if (!isNaN(dateInscripcion.getTime())) {
        playerToUpdate.fecha_inscripcion = dateInscripcion;
      }
    }

    if (clubId && Number(clubId) !== playerToUpdate.club?.id) {
      const club = await this.clubRepo.findOne({ where: { id: Number(clubId) } });
      if (!club) {
        throw new BadRequestException('El club especificado no existe');
      }
      playerToUpdate.club = club;
    }

    if (file) {
      if (playerToUpdate.foto) {
        const oldPhotoPath = path.join(process.cwd(), 'uploads', playerToUpdate.foto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      playerToUpdate.foto = `players/${file.filename}`;
    }

    if (sancionado !== undefined) {
      const valSancionado = String(sancionado).toLowerCase();
      playerToUpdate.sancionado = valSancionado === 'true' || valSancionado === '1';
    }

    if (recalificado !== undefined) {
      const valRecalificado = String(recalificado).toLowerCase();
      playerToUpdate.recalificado = valRecalificado === 'true' || valRecalificado === '1';
    }

    await this.jugadoresRepository.save(playerToUpdate);

    const updated = await this.jugadoresRepository.findOne({
      where: { id },
      relations: ['club', 'club.asociacion', 'club.asociacion.region'],
    });

    if (!updated) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado tras actualizar.`);
    }

    return updated;
  }

  // ==========================================
  // CONSULTAS Y BÚSQUEDAS
  // ==========================================

  async findAll(paginationDto: PaginationDto, user?: { role: string; regionId?: number }) {
    const {
      page = 1,
      limit = 10,
      rut,
      nombre,
      paterno,
      materno,
      clubName,
      asociacionName,
      regionName,
      regionId,
      search,
    } = paginationDto;

    const query = this.jugadoresRepository
      .createQueryBuilder('jugador')
      .leftJoinAndSelect('jugador.club', 'club')
      .leftJoinAndSelect('club.asociacion', 'asociacion')
      .leftJoinAndSelect('asociacion.region', 'region')
      // 🟢 CLAVE: Muestra los registros donde duplicado es false O es NULL
      .where('(jugador.duplicado = :duplicado OR jugador.duplicado IS NULL)', { duplicado: false });

    const targetRegionId = user?.role === 'dirigente' ? user.regionId : regionId;
    if (targetRegionId) {
      query.andWhere('region.id = :regionId', { regionId: targetRegionId });
    }

    if (rut) {
      const rutLimpio = rut.replace(/[^0-9kK]/g, '');
      query.andWhere("REPLACE(REPLACE(jugador.rut, '.', ''), '-', '') LIKE :rutLimpio", {
        rutLimpio: `%${rutLimpio}%`,
      });
    }
    if (nombre) query.andWhere('jugador.nombre LIKE :nombre', { nombre: `%${nombre}%` });
    if (paterno) query.andWhere('jugador.paterno LIKE :paterno', { paterno: `%${paterno}%` });
    if (materno) query.andWhere('jugador.materno LIKE :materno', { materno: `%${materno}%` });
    if (clubName) query.andWhere('club.name LIKE :clubName', { clubName: `%${clubName}%` });
    if (asociacionName)
      query.andWhere('asociacion.name LIKE :asociacionName', {
        asociacionName: `%${asociacionName}%`,
      });
    if (regionName) query.andWhere('region.name LIKE :regionName', { regionName: `%${regionName}%` });

    if (search) {
      query.andWhere(
        '(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)',
        { s: `%${search}%` },
      );
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('jugador.id', 'DESC');

    const [players, total] = await query.getManyAndCount();

    return { players, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Jugador> {
    const jugador = await this.jugadoresRepository.findOne({
      where: { id },
      relations: ['club', 'club.asociacion', 'club.asociacion.region'],
    });

    if (!jugador) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado.`);
    }

    return jugador;
  }

  async buscarPorRut(rut: string): Promise<Jugador | null> {
    const rutNormalizado = this.normalizarFormatoRut(rut);

    const jugador = await this.jugadoresRepository.findOne({
      where: { rut: rutNormalizado },
      relations: ['club', 'club.asociacion', 'club.asociacion.region'],
    });

    return jugador;
  }

  async obtenerDuplicados(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      rut,
      nombre,
      paterno,
      materno,
      clubName,
      asociacionName,
      regionName,
      search,
    } = paginationDto;

    const query = this.jugadoresRepository
      .createQueryBuilder('jugador')
      .leftJoinAndSelect('jugador.club', 'club')
      .leftJoinAndSelect('club.asociacion', 'asociacion')
      .leftJoinAndSelect('asociacion.region', 'region')
      .where('jugador.duplicado = :duplicado', { duplicado: true });

    // 🟢 Validar que las variables contengan texto real y no solo cadenas vacías ""
    if (rut && rut.trim() !== '') {
      const rutLimpio = rut.replace(/[^0-9kK]/g, '');
      query.andWhere("REPLACE(REPLACE(jugador.rut, '.', ''), '-', '') LIKE :rutLimpio", {
        rutLimpio: `%${rutLimpio}%`,
      });
    }

    if (nombre && nombre.trim() !== '') {
      query.andWhere('jugador.nombre LIKE :nombre', { nombre: `%${nombre.trim()}%` });
    }

    if (paterno && paterno.trim() !== '') {
      query.andWhere('jugador.paterno LIKE :paterno', { paterno: `%${paterno.trim()}%` });
    }

    if (materno && materno.trim() !== '') {
      query.andWhere('jugador.materno LIKE :materno', { materno: `%${materno.trim()}%` });
    }

    if (clubName && clubName.trim() !== '') {
      query.andWhere('club.name LIKE :clubName', { clubName: `%${clubName.trim()}%` });
    }

    if (asociacionName && asociacionName.trim() !== '') {
      query.andWhere('asociacion.name LIKE :asociacionName', { asociacionName: `%${asociacionName.trim()}%` });
    }

    if (regionName && regionName.trim() !== '') {
      query.andWhere('region.name LIKE :regionName', { regionName: `%${regionName.trim()}%` });
    }

    if (search && search.trim() !== '') {
      query.andWhere(
        '(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)',
        { s: `%${search.trim()}%` },
      );
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('jugador.id', 'DESC');

    const [jugadores, total] = await query.getManyAndCount();

    return {
      jugadores,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==========================================
  // GESTIÓN DE SOFT-DELETE Y RESTAURACIÓN
  // ==========================================

  async deletePlay(id: number): Promise<Jugador> {
    const playerToMark = await this.findOne(id);
    await this.jugadoresRepository.update(id, { duplicado: true });
    playerToMark.duplicado = true;
    return playerToMark;
  }

  async deleteMany(ids: number[]): Promise<{ affected: number }> {
    const result = await this.jugadoresRepository.update(ids, { duplicado: true });
    return { affected: result.affected || 0 };
  }

  async volverPlay(id: number): Promise<Jugador> {
    const playerToMark = await this.findOne(id);
    await this.jugadoresRepository.update(id, { duplicado: false });
    playerToMark.duplicado = false;
    return playerToMark;
  }

  // ==========================================
  // IMPORTACIÓN Y PROCESAMIENTO EXCEL
  // ==========================================

  async markDuplicates(): Promise<{ message: string; duplicates: string[] }> {
    try {
      const players = await this.jugadoresRepository
        .createQueryBuilder('jugador')
        .select('jugador.rut')
        .addSelect('COUNT(jugador.id)', 'count')
        .groupBy('jugador.rut')
        .having('COUNT(jugador.id) > 1')
        .getRawMany();

      const duplicateRuts = players.map((player) => player.rut);

      if (duplicateRuts.length > 0) {
        await this.jugadoresRepository
          .createQueryBuilder()
          .update(Jugador)
          .set({ duplicado: true })
          .where('rut IN (:...duplicateRuts)', { duplicateRuts })
          .execute();
      }

      return {
        message: `Se marcaron ${duplicateRuts.length} RUTs duplicados.`,
        duplicates: duplicateRuts,
      };
    } catch (error) {
      this.logger.error('Error al marcar duplicados:', error);
      throw new BadRequestException('Fallo la actualización de duplicados.');
    }
  }

  async importFromExcel(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const filas: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });

    let creados = 0;
    let duplicados = 0;

    for (const fila of filas) {
      const rutFormateado = this.normalizarFormatoRut(fila.rut);
      if (!rutFormateado) continue;

      const fechaNacimiento = this.parseExcelDate(fila.fecha_nacimiento);
      const fechaInscripcion = this.parseExcelDate(fila.fecha_inscripcion) || new Date();

      // 1. Buscar si YA EXISTE en la BD (independiente de si duplicado es true o false)
      const jugadorExistente = await this.jugadoresRepository.findOne({
        where: { rut: rutFormateado },
      });

      if (jugadorExistente) {
        // 2. Si ya existe, se marca como duplicado para enviarlo a la vista de duplicados sin violar la clave UNIQUE
        await this.jugadoresRepository.update(jugadorExistente.id, {
          duplicado: true,
        });
        duplicados++;
      } else {
        // 3. Si no existe, se inserta normalmente
        try {
          const nuevoJugador = this.jugadoresRepository.create({
            rut: rutFormateado,
            nombre: fila.nombre || 'Sin Nombre',
            paterno: fila.paterno || '',
            materno: fila.materno || '',
            fecha_nacimiento: fechaNacimiento,
            fecha_inscripcion: fechaInscripcion,
            duplicado: false,
          });

          await this.jugadoresRepository.save(nuevoJugador);
          creados++;
        } catch (error) {
          // En caso de colisión simultánea de concurrencia
          this.logger.error(`Error al guardar RUT ${rutFormateado}:`, error);
        }
      }
    }

    return {
      message: 'Importación procesada con éxito',
      totalFilas: filas.length,
      creados,
      duplicados,
    };
  }

  // Helper para estandarizar el RUT
  private limpiarYFormatearRut(rut: any): string | null {
    if (!rut) return null;
    const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2) return null;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${conPuntos}-${dv}`;
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  private normalizarFormatoRut(rut: string): string {
    if (!rut) return '';
    const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2) return rut;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${conPuntos}-${dv}`;
  }

  private convertirFechaExcel(excelDate: number): Date {
    const epoch = new Date(1900, 0, 1);
    epoch.setDate(epoch.getDate() + excelDate - 2);
    return epoch;
  }

  private cleanField(value: any): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value ?? null;
  }

  // Helper de fechas (mantiene la conversión para evitar el error 45189 de Excel)
  private parseExcelDate(excelDate: number | string | Date): Date | null {
    if (!excelDate) return null;
    if (excelDate instanceof Date) return isNaN(excelDate.getTime()) ? null : excelDate;

    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof excelDate === 'string') {
      const parsedDate = new Date(excelDate);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    return null;
  }

  async marcarComoDuplicadosMasivo(ids?: number[]) {
    const query = this.jugadoresRepository
      .createQueryBuilder()
      .update(Jugador)
      .set({ duplicado: true });

    // Si se envían IDs específicos, solo actualiza esos
    if (ids && ids.length > 0) {
      query.where('id IN (:...ids)', { ids });
    }
    // Si no se envían IDs, actualiza TODOS los registros

    const result = await query.execute();

    return {
      message: 'Restauración/Actualización masiva completada con éxito',
      registrosAfectados: result.affected || 0,
    };
  }

  /**
   * Método opcional inverso: Desmarcar duplicados masivamente (duplicado -> false)
   */
  async restaurarMasivo(ids?: number[]) {
    const query = this.jugadoresRepository
      .createQueryBuilder()
      .update(Jugador)
      .set({ duplicado: false });

    if (ids && ids.length > 0) {
      query.where('id IN (:...ids)', { ids });
    }

    const result = await query.execute();

    return {
      message: 'Jugadores restaurados a la lista principal exitosamente',
      registrosAfectados: result.affected || 0,
    };
  }

  async obtenerDuplicadosPorRegion(regionId: number, paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      rut,
      nombre,
      paterno,
      materno,
      clubName,
      asociacionName,
      regionName,
      search,
    } = paginationDto;

    const query = this.jugadoresRepository
      .createQueryBuilder('jugador')
      .leftJoinAndSelect('jugador.club', 'club')
      .leftJoinAndSelect('club.asociacion', 'asociacion')
      .leftJoinAndSelect('asociacion.region', 'region')
      .where('jugador.duplicado = :duplicado', { duplicado: true })
      .andWhere('region.id = :regionId', { regionId }); // 🟢 Filtro estricto por ID de Región

    if (rut && rut.trim() !== '') {
      const rutLimpio = rut.replace(/[^0-9kK]/g, '');
      query.andWhere("REPLACE(REPLACE(jugador.rut, '.', ''), '-', '') LIKE :rutLimpio", {
        rutLimpio: `%${rutLimpio}%`,
      });
    }

    if (nombre && nombre.trim() !== '') {
      query.andWhere('jugador.nombre LIKE :nombre', { nombre: `%${nombre.trim()}%` });
    }

    if (paterno && paterno.trim() !== '') {
      query.andWhere('jugador.paterno LIKE :paterno', { paterno: `%${paterno.trim()}%` });
    }

    if (materno && materno.trim() !== '') {
      query.andWhere('jugador.materno LIKE :materno', { materno: `%${materno.trim()}%` });
    }

    if (clubName && clubName.trim() !== '') {
      query.andWhere('club.name LIKE :clubName', { clubName: `%${clubName.trim()}%` });
    }

    if (asociacionName && asociacionName.trim() !== '') {
      query.andWhere('asociacion.name LIKE :asociacionName', { asociacionName: `%${asociacionName.trim()}%` });
    }

    if (regionName && regionName.trim() !== '') {
      query.andWhere('region.name LIKE :regionName', { regionName: `%${regionName.trim()}%` });
    }

    if (search && search.trim() !== '') {
      query.andWhere(
        '(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)',
        { s: `%${search.trim()}%` },
      );
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('jugador.id', 'DESC');

    const [jugadores, total] = await query.getManyAndCount();

    return {
      jugadores,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }
}