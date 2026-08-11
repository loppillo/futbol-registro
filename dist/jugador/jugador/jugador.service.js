"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JugadoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JugadoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const jugador_entity_1 = require("./entities/jugador.entity");
const asociacion_entity_1 = require("../../asociacion/asociacion/entities/asociacion.entity");
const club_entity_1 = require("../../club/club/entities/club.entity");
const region_entity_1 = require("../../region/region/entities/region.entity");
let JugadoresService = JugadoresService_1 = class JugadoresService {
    constructor(regionRepo, associationRepo, clubRepo, jugadoresRepository, configService) {
        this.regionRepo = regionRepo;
        this.associationRepo = associationRepo;
        this.clubRepo = clubRepo;
        this.jugadoresRepository = jugadoresRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(JugadoresService_1.name);
        this.threshold = 10;
    }
    async createPlayer(createJugadorDto, file) {
        const { rut, clubId, nombre, paterno, materno, fecha_nacimiento, fecha_inscripcion, recalificado, } = createJugadorDto;
        const rutNormalizado = this.normalizarFormatoRut(rut);
        const clubIdNumber = parseInt(clubId.toString(), 10);
        if (isNaN(clubIdNumber)) {
            throw new common_1.BadRequestException('El clubId es inválido o no es un número.');
        }
        const jugadorExistente = await this.jugadoresRepository.findOne({
            where: { rut: rutNormalizado },
        });
        if (jugadorExistente) {
            throw new common_1.ConflictException(`El jugador con el RUT ${rutNormalizado} ya se encuentra registrado.`);
        }
        const club = await this.clubRepo.findOne({ where: { id: clubIdNumber } });
        if (!club) {
            throw new common_1.NotFoundException('El club especificado no existe.');
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
    async updatePlay(id, updateJugadorDto, file) {
        const playerToUpdate = await this.jugadoresRepository.findOne({
            where: { id },
            relations: ['club', 'club.asociacion'],
        });
        if (!playerToUpdate) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado`);
        }
        const { clubId, fecha_nacimiento, fecha_inscripcion, sancionado, recalificado, rut, ...demasCampos } = updateJugadorDto;
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
                throw new common_1.BadRequestException('El club especificado no existe');
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
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado tras actualizar.`);
        }
        return updated;
    }
    async findAll(paginationDto, user) {
        const { page = 1, limit = 10, rut, nombre, paterno, materno, clubName, asociacionName, regionName, regionId, search, } = paginationDto;
        const query = this.jugadoresRepository
            .createQueryBuilder('jugador')
            .leftJoinAndSelect('jugador.club', 'club')
            .leftJoinAndSelect('club.asociacion', 'asociacion')
            .leftJoinAndSelect('asociacion.region', 'region')
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
        if (nombre)
            query.andWhere('jugador.nombre LIKE :nombre', { nombre: `%${nombre}%` });
        if (paterno)
            query.andWhere('jugador.paterno LIKE :paterno', { paterno: `%${paterno}%` });
        if (materno)
            query.andWhere('jugador.materno LIKE :materno', { materno: `%${materno}%` });
        if (clubName)
            query.andWhere('club.name LIKE :clubName', { clubName: `%${clubName}%` });
        if (asociacionName)
            query.andWhere('asociacion.name LIKE :asociacionName', {
                asociacionName: `%${asociacionName}%`,
            });
        if (regionName)
            query.andWhere('region.name LIKE :regionName', { regionName: `%${regionName}%` });
        if (search) {
            query.andWhere('(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)', { s: `%${search}%` });
        }
        query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('jugador.id', 'DESC');
        const [players, total] = await query.getManyAndCount();
        return { players, total, page, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const jugador = await this.jugadoresRepository.findOne({
            where: { id },
            relations: ['club', 'club.asociacion', 'club.asociacion.region'],
        });
        if (!jugador) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado.`);
        }
        return jugador;
    }
    async buscarPorRut(rut) {
        const rutNormalizado = this.normalizarFormatoRut(rut);
        const jugador = await this.jugadoresRepository.findOne({
            where: { rut: rutNormalizado },
            relations: ['club', 'club.asociacion', 'club.asociacion.region'],
        });
        return jugador;
    }
    async obtenerDuplicados(paginationDto) {
        const { page = 1, limit = 10, rut, nombre, paterno, materno, clubName, asociacionName, regionName, search, } = paginationDto;
        const query = this.jugadoresRepository
            .createQueryBuilder('jugador')
            .leftJoinAndSelect('jugador.club', 'club')
            .leftJoinAndSelect('club.asociacion', 'asociacion')
            .leftJoinAndSelect('asociacion.region', 'region')
            .where('jugador.duplicado = :duplicado', { duplicado: true });
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
            query.andWhere('(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)', { s: `%${search.trim()}%` });
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
    async deletePlay(id) {
        const playerToMark = await this.findOne(id);
        await this.jugadoresRepository.update(id, { duplicado: true });
        playerToMark.duplicado = true;
        return playerToMark;
    }
    async deleteMany(ids) {
        const result = await this.jugadoresRepository.update(ids, { duplicado: true });
        return { affected: result.affected || 0 };
    }
    async volverPlay(id) {
        const playerToMark = await this.findOne(id);
        await this.jugadoresRepository.update(id, { duplicado: false });
        playerToMark.duplicado = false;
        return playerToMark;
    }
    async markDuplicates() {
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
                    .update(jugador_entity_1.Jugador)
                    .set({ duplicado: true })
                    .where('rut IN (:...duplicateRuts)', { duplicateRuts })
                    .execute();
            }
            return {
                message: `Se marcaron ${duplicateRuts.length} RUTs duplicados.`,
                duplicates: duplicateRuts,
            };
        }
        catch (error) {
            this.logger.error('Error al marcar duplicados:', error);
            throw new common_1.BadRequestException('Fallo la actualización de duplicados.');
        }
    }
    async importFromExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const filas = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        let creados = 0;
        let duplicados = 0;
        for (const fila of filas) {
            const rutFormateado = this.normalizarFormatoRut(fila.rut);
            if (!rutFormateado)
                continue;
            const fechaNacimiento = this.parseExcelDate(fila.fecha_nacimiento);
            const fechaInscripcion = this.parseExcelDate(fila.fecha_inscripcion) || new Date();
            const jugadorExistente = await this.jugadoresRepository.findOne({
                where: { rut: rutFormateado },
            });
            if (jugadorExistente) {
                await this.jugadoresRepository.update(jugadorExistente.id, {
                    duplicado: true,
                });
                duplicados++;
            }
            else {
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
                }
                catch (error) {
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
    limpiarYFormatearRut(rut) {
        if (!rut)
            return null;
        const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
        if (limpio.length < 2)
            return null;
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${conPuntos}-${dv}`;
    }
    normalizarFormatoRut(rut) {
        if (!rut)
            return '';
        const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
        if (limpio.length < 2)
            return rut;
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${conPuntos}-${dv}`;
    }
    convertirFechaExcel(excelDate) {
        const epoch = new Date(1900, 0, 1);
        epoch.setDate(epoch.getDate() + excelDate - 2);
        return epoch;
    }
    cleanField(value) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed === '' ? null : trimmed;
        }
        return value ?? null;
    }
    parseExcelDate(excelDate) {
        if (!excelDate)
            return null;
        if (excelDate instanceof Date)
            return isNaN(excelDate.getTime()) ? null : excelDate;
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
    async marcarComoDuplicadosMasivo(ids) {
        const query = this.jugadoresRepository
            .createQueryBuilder()
            .update(jugador_entity_1.Jugador)
            .set({ duplicado: true });
        if (ids && ids.length > 0) {
            query.where('id IN (:...ids)', { ids });
        }
        const result = await query.execute();
        return {
            message: 'Restauración/Actualización masiva completada con éxito',
            registrosAfectados: result.affected || 0,
        };
    }
    async restaurarMasivo(ids) {
        const query = this.jugadoresRepository
            .createQueryBuilder()
            .update(jugador_entity_1.Jugador)
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
    async obtenerDuplicadosPorRegion(regionId, paginationDto) {
        const { page = 1, limit = 10, rut, nombre, paterno, materno, clubName, asociacionName, regionName, search, } = paginationDto;
        const query = this.jugadoresRepository
            .createQueryBuilder('jugador')
            .leftJoinAndSelect('jugador.club', 'club')
            .leftJoinAndSelect('club.asociacion', 'asociacion')
            .leftJoinAndSelect('asociacion.region', 'region')
            .where('jugador.duplicado = :duplicado', { duplicado: true })
            .andWhere('region.id = :regionId', { regionId });
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
            query.andWhere('(jugador.rut LIKE :s OR jugador.nombre LIKE :s OR jugador.paterno LIKE :s OR jugador.materno LIKE :s OR club.name LIKE :s)', { s: `%${search.trim()}%` });
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
};
exports.JugadoresService = JugadoresService;
exports.JugadoresService = JugadoresService = JugadoresService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(region_entity_1.Region)),
    __param(1, (0, typeorm_1.InjectRepository)(asociacion_entity_1.Asociacion)),
    __param(2, (0, typeorm_1.InjectRepository)(club_entity_1.Club)),
    __param(3, (0, typeorm_1.InjectRepository)(jugador_entity_1.Jugador)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], JugadoresService);
//# sourceMappingURL=jugador.service.js.map