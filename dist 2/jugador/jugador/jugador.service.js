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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JugadoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jugador_entity_1 = require("./entities/jugador.entity");
const club_entity_1 = require("../../club/club/entities/club.entity");
const asociacion_entity_1 = require("../../asociacion/asociacion/entities/asociacion.entity");
const region_entity_1 = require("../../region/region/entities/region.entity");
const XLSX = require("xlsx");
const fast_levenshtein_1 = require("fast-levenshtein");
const date_fns_1 = require("date-fns");
let JugadoresService = class JugadoresService {
    constructor(regionRepo, associationRepo, clubRepo, jugadoresRepository) {
        this.regionRepo = regionRepo;
        this.associationRepo = associationRepo;
        this.clubRepo = clubRepo;
        this.jugadoresRepository = jugadoresRepository;
        this.threshold = 10;
    }
    async create(createJugadorDto) {
        const { rut, clubId, nombre, paterno, materno, fecha_nacimiento, fecha_inscripcion, foto, recalificado } = createJugadorDto;
        const clubIdNumber = parseInt(clubId.toString(), 10);
        if (isNaN(clubIdNumber)) {
            throw new common_1.BadRequestException('El clubId es inválido o no es un número.');
        }
        const jugadorExistente = await this.jugadoresRepository.findOne({ where: { rut } });
        if (jugadorExistente) {
            throw new common_1.ConflictException('El jugador con este RUT ya existe.');
        }
        const club = await this.clubRepo.findOne({ where: { id: clubIdNumber } });
        if (!club) {
            throw new common_1.NotFoundException('El club especificado no existe.');
        }
        const nuevoJugador = this.jugadoresRepository.create({
            rut,
            nombre,
            paterno,
            materno,
            fecha_nacimiento,
            fecha_inscripcion,
            foto: null,
            recalificado,
            club,
        });
        return this.jugadoresRepository.save(nuevoJugador);
    }
    async obtenerJugadorPorId(id) {
        const jugador = await this.jugadoresRepository.findOne({ where: { id } });
        if (!jugador) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado`);
        }
        return jugador;
    }
    async findAll(paginationDto) {
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
                    } : null,
                } : null,
            } : null,
            sancionado: player.sancionado,
            recalificado: player.recalificado,
            duplicado: Boolean(player.duplicado),
        }));
        return {
            players: playersDto,
            total,
        };
    }
    async findOne(id) {
        const jugador = await this.jugadoresRepository.findOneBy({ id });
        if (!jugador) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado.`);
        }
        return jugador;
    }
    async update(id, updateJugadorDto) {
        return this.findOne(id);
    }
    async remove(id) {
        const jugador = await this.findOne(id);
        await this.jugadoresRepository.remove(jugador);
    }
    convertirFechaExcel(fechaExcel) {
        const fechaBase = new Date(1900, 0, fechaExcel - 1);
        fechaBase.setDate(fechaBase.getDate() + 1);
        return fechaBase.toISOString().split('T')[0];
    }
    async importarJugadores(jugadores) {
        const errores = [];
        const jugadoresGuardados = [];
        for (const jugador of jugadores) {
            const { id, paterno, materno, nombre, rut, fecha_nacimiento, club_deportivo, asociacion, fecha_inscripcion } = jugador;
            const fechaNacimientoValida = typeof fecha_nacimiento === 'number'
                ? this.convertirFechaExcel(fecha_nacimiento)
                : fecha_nacimiento;
            const fechaInscripcionValida = typeof fecha_inscripcion === 'number'
                ? this.convertirFechaExcel(fecha_inscripcion)
                : fecha_inscripcion || '2024-08-20';
            const jugadorExistente = await this.jugadoresRepository.findOne({ where: { rut } });
        }
        await this.markDuplicates();
        return {
            jugadoresGuardados,
            errores,
        };
    }
    async markDuplicates() {
        try {
            const players = await this.jugadoresRepository
                .createQueryBuilder("jugador")
                .select("jugador.rut")
                .addSelect("COUNT(jugador.id)", "count")
                .groupBy("jugador.rut")
                .having("COUNT(jugador.id) > 1")
                .getRawMany();
            const duplicateRuts = players.map((player) => player.rut);
            if (duplicateRuts.length > 0) {
                await this.jugadoresRepository
                    .createQueryBuilder()
                    .update(jugador_entity_1.Jugador)
                    .set({ duplicado: 1 })
                    .where("rut IN (:...duplicateRuts)", { duplicateRuts })
                    .execute();
            }
            return { message: `Marked ${duplicateRuts.length} duplicate RUTs.`, duplicates: duplicateRuts };
        }
        catch (error) {
            console.error("Error marking duplicates:", error);
            throw new Error("Failed to mark duplicate players.");
        }
    }
    async buscarPorRut(rut) {
        const jugador = await this.jugadoresRepository.findOne({
            where: { rut },
            relations: ['club', 'club.asociacion', 'club.asociacion.region'],
        });
        if (jugador && jugador.foto) {
            jugador.foto = `${process.env.BASE_URL}/${jugador.foto}`;
        }
        return jugador;
    }
    async buscarPorClub(club_deportivo, regionName) {
        const jugadores = await this.jugadoresRepository
            .createQueryBuilder('jugador')
            .leftJoinAndSelect('jugador.club', 'club')
            .leftJoinAndSelect('club.asociacion', 'asociacion')
            .leftJoinAndSelect('asociacion.region', 'region')
            .where('club.name = :club_deportivo', { club_deportivo })
            .andWhere('region.name = :regionName', { regionName })
            .getMany();
        return jugadores;
    }
    async findAllPaginated(page, limit) {
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
    async updatePlayerImage(playerId, imagePath) {
        const player = await this.jugadoresRepository.findOne({ where: { id: playerId } });
        if (player) {
            player.foto = imagePath;
            return await this.jugadoresRepository.save(player);
        }
        throw new common_1.NotFoundException('Jugador no encontrado');
    }
    async createProductWithImage(id, foto) {
        const player = await this.jugadoresRepository.findOne({ where: { id: id } });
        if (!player) {
            throw new Error('Jugador no encontrado');
        }
        player.foto = foto;
        return await this.jugadoresRepository.save(player);
    }
    async findPlayerById(id) {
        const player = await this.jugadoresRepository.findOne({ where: { id: id } });
        if (!player) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado`);
        }
        return player;
    }
    async findAllPlayers() {
        return await this.jugadoresRepository.find();
    }
    async createPlayer(createPlayerDto, imagePath) {
        const jugadorExistente = await this.jugadoresRepository.findOneBy({
            rut: createPlayerDto.rut,
        });
        if (jugadorExistente) {
            throw new Error('El jugador con este RUT ya existe.');
        }
        const newPlayer = this.jugadoresRepository.create(createPlayerDto);
        if (imagePath) {
            newPlayer.foto = imagePath;
        }
        return await this.jugadoresRepository.save(newPlayer);
    }
    async updatePlayer(id, updatePlayerDto) {
        const playerToUpdate = await this.jugadoresRepository.findOne({ where: { id } });
        if (!playerToUpdate) {
            throw new common_1.NotFoundException('Player not found');
        }
        Object.assign(playerToUpdate, updatePlayerDto);
        return await this.jugadoresRepository.save(playerToUpdate);
    }
    async updatePlay(id, updatePlayerDto, imagePath) {
        const playerToUpdate = await this.jugadoresRepository.findOne({ where: { id } });
        if (!playerToUpdate) {
            throw new common_1.NotFoundException('Jugador no encontrado');
        }
        const allowedFields = ['nombre', 'paterno', 'materno', 'rut', 'fecha_nacimiento', 'fecha_inscripcion', 'sancionado'];
        const filteredDto = Object.keys(updatePlayerDto)
            .filter((key) => allowedFields.includes(key))
            .reduce((obj, key) => {
            obj[key] = updatePlayerDto[key];
            return obj;
        }, {});
        if (filteredDto['fecha_nacimiento']) {
            filteredDto['fecha_nacimiento'] = (0, date_fns_1.format)(new Date(filteredDto['fecha_nacimiento']), 'yyyy-MM-dd');
        }
        if (filteredDto['fecha_inscripcion']) {
            filteredDto['fecha_inscripcion'] = (0, date_fns_1.format)(new Date(filteredDto['fecha_inscripcion']), 'yyyy-MM-dd');
        }
        Object.assign(playerToUpdate, filteredDto);
        if (imagePath) {
            playerToUpdate.foto = imagePath;
        }
        return this.jugadoresRepository.save(playerToUpdate);
    }
    async getAllPlayers(paginationDto) {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const [players, total] = await this.jugadoresRepository.findAndCount({
            skip,
            take: limit,
        });
        const totalPages = Math.ceil(total / limit);
    }
    async obtenerDuplicados(page = 1, limit = 10) {
        const [jugadores, total] = await this.jugadoresRepository.findAndCount({
            where: { duplicado: 1 },
            relations: [
                'club',
                'club.asociacion',
                'club.asociacion.region',
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
    async importFromExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (data.length === 0) {
            console.warn('El archivo Excel está vacío.');
            return { message: 'No hay registros para importar.' };
        }
        const convertirFechaExcel = (excelDate) => {
            const epoch = new Date(1900, 0, 1);
            epoch.setDate(epoch.getDate() + excelDate - 2);
            return epoch;
        };
        for (const [index, row] of data.entries()) {
            try {
                const requiredFields = ['paterno', 'materno', 'nombre', 'rut', 'club_deportivo', 'fecha_nacimiento', 'fecha_inscripcion'];
                const missingFields = requiredFields.filter(field => !row[field]);
                if (missingFields.length) {
                    console.warn(`Fila ${index + 1}: Faltan campos esenciales: ${missingFields.join(', ')}`);
                    continue;
                }
                console.log(`Procesando fila ${index + 1}: ${JSON.stringify(row)}`);
                const fechaNacimientoValida = typeof row['fecha_nacimiento'] === 'number'
                    ? convertirFechaExcel(row['fecha_nacimiento'])
                    : row['fecha_nacimiento'];
                const fechaInscripcionValida = typeof row['fecha_inscripcion'] === 'number'
                    ? convertirFechaExcel(row['fecha_inscripcion'])
                    : row['fecha_inscripcion'] || '2023-08-20';
                if (isNaN(fechaNacimientoValida.getTime())) {
                    console.warn(`Fila ${index + 1}: Fecha de nacimiento inválida. Fecha de nacimiento: ${row['fecha_nacimiento']}`);
                    continue;
                }
                let fechaInscripcion;
                try {
                    fechaInscripcion = fechaInscripcionValida instanceof Date ? fechaInscripcionValida : new Date(2023, 8, 20);
                }
                catch (error) {
                    console.error(`Fila ${index + 1}: Error procesando fecha de inscripción - ${error.message}`);
                    continue;
                }
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
                const player = this.jugadoresRepository.create({
                    paterno: row['paterno'],
                    materno: row['materno'],
                    nombre: row['nombre'],
                    rut: row['rut'],
                    fecha_nacimiento: fechaNacimientoValida,
                    fecha_inscripcion: fechaInscripcion,
                    foto: null,
                    recalificado: false,
                    sancionado: false,
                    duplicado: 0,
                    club,
                });
                await this.jugadoresRepository.save(player);
                console.log(`Jugador guardado exitosamente: ${player.nombre}`);
            }
            catch (error) {
                console.error(`Error en fila ${index + 1}: ${error.message}`);
            }
        }
        return { message: 'Importación completada exitosamente' };
    }
    processExcel(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const mainSheetName = 'MainData';
        const referenceSheetName = 'ReferenceData';
        if (!workbook.SheetNames.includes(mainSheetName) || !workbook.SheetNames.includes(referenceSheetName)) {
            throw new Error(`Las hojas '${mainSheetName}' o '${referenceSheetName}' no se encuentran en el archivo.`);
        }
        const mainSheet = workbook.Sheets[mainSheetName];
        const referenceSheet = workbook.Sheets[referenceSheetName];
        const mainData = XLSX.utils.sheet_to_json(mainSheet);
        const referenceData = XLSX.utils.sheet_to_json(referenceSheet);
        if (mainData.length === 0 || referenceData.length === 0) {
            throw new Error('Una de las hojas está vacía.');
        }
        return { mainData, referenceData };
    }
    fillMissingData(mainData, referenceData) {
        if (!mainData || !referenceData || mainData.length === 0 || referenceData.length === 0) {
            throw new Error('No hay datos suficientes para completar la operación.');
        }
        const referenceMap = new Map();
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
            let matchedClub = referenceMap.get(clubNameLower);
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
    findClosestMatch(clubName, referenceData) {
        let closestMatch = null;
        let lowestDistance = this.threshold + 1;
        for (const reference of referenceData) {
            if (!reference.club)
                continue;
            const distance = fast_levenshtein_1.levenshtein.get(clubName.toLowerCase(), reference.club.toLowerCase());
            if (distance < lowestDistance) {
                closestMatch = reference;
                lowestDistance = distance;
            }
            if (distance === 0) {
                break;
            }
        }
        return closestMatch || null;
    }
    async deletePlay(id) {
        const playerToMark = await this.jugadoresRepository.findOne({ where: { id } });
        if (!playerToMark) {
            throw new common_1.NotFoundException('Jugador no encontrado');
        }
        playerToMark.duplicado = 1;
        return this.jugadoresRepository.save(playerToMark);
    }
    async updateJugadorPhoto(id, filePath) {
        const jugador = await this.jugadoresRepository.findOne({ where: { id } });
        if (!jugador) {
            throw new common_1.NotFoundException('Jugador no encontrado');
        }
        jugador.foto = filePath;
        await this.jugadoresRepository.save(jugador);
    }
};
exports.JugadoresService = JugadoresService;
exports.JugadoresService = JugadoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(region_entity_1.Region)),
    __param(1, (0, typeorm_1.InjectRepository)(asociacion_entity_1.Asociacion)),
    __param(2, (0, typeorm_1.InjectRepository)(club_entity_1.Club)),
    __param(3, (0, typeorm_1.InjectRepository)(jugador_entity_1.Jugador)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], JugadoresService);
//# sourceMappingURL=jugador.service.js.map