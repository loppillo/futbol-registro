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
exports.JugadoresController = exports.Users = void 0;
const common_1 = require("@nestjs/common");
const jugador_service_1 = require("./jugador.service");
const create_jugador_dto_1 = require("./dto/create-jugador.dto");
const update_jugador_dto_1 = require("./dto/update-jugador.dto");
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = require("xlsx");
const multer_1 = require("multer");
const uuid_1 = require("uuid");
const path_1 = require("path");
const fs = require("fs");
const path = require("path");
const PaginationDto_dto_1 = require("./dto/PaginationDto.dto");
const typeorm_1 = require("@nestjs/typeorm");
const jugador_entity_1 = require("./entities/jugador.entity");
const typeorm_2 = require("typeorm");
const auth_guard_1 = require("../../auth/guard/auth.guard");
const jwt_strategy_1 = require("../../auth/jwt.strategy");
const storage = (0, multer_1.diskStorage)({
    destination: './uploads/jugadores',
    filename: (req, file, cb) => {
        const uniqueSuffix = (0, uuid_1.v4)() + (0, path_1.extname)(file.originalname);
        cb(null, uniqueSuffix);
    }
});
exports.Users = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
let JugadoresController = class JugadoresController {
    constructor(jugadoresService, jugadoresRepository) {
        this.jugadoresService = jugadoresService;
        this.jugadoresRepository = jugadoresRepository;
    }
    create(createJugadorDto) {
        return this.jugadoresService.create(createJugadorDto);
    }
    async obtenerDuplicados(page = 1, limit = 10) {
        const pageNumber = isNaN(Number(page)) ? 1 : Number(page);
        const limitNumber = isNaN(Number(limit)) ? 10 : Number(limit);
        const skip = (pageNumber - 1) * limitNumber;
        return this.jugadoresService.obtenerDuplicados(page, limit);
    }
    async createPlayer(file, playerData) {
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const imagePath = `uploads/players/${file.filename}`;
        const player = await this.jugadoresService.createPlayer({
            ...playerData,
            foto: imagePath,
        });
        console.log('Uploaded file:', file);
        console.log('Player data:', playerData);
        return {
            message: 'Jugador created successfully',
            player: {
                ...player,
                imagePath: `http://localhost:3000/api/v1/${imagePath}`,
            },
        };
    }
    async getPlayers(paginationDto) {
        return this.jugadoresService.findAll(paginationDto);
    }
    async importExcel(file) {
        const imagePath = file.path;
        return await this.jugadoresService.importFromExcel(imagePath);
    }
    async getJugadores(page = 1, limit = 10) {
        return this.jugadoresService.findAllPaginated(page, limit);
    }
    async getJugadorPorId(id) {
        return await this.jugadoresService.obtenerJugadorPorId(id);
    }
    update(id, updateJugadorDto) {
        return this.jugadoresService.updatePlay(+id, updateJugadorDto);
    }
    remove(id) {
        return this.jugadoresService.deletePlay(+id);
    }
    async importarJugadores(file) {
        if (!file) {
            throw new common_1.BadRequestException('No se ha proporcionado ningún archivo');
        }
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jugadores = XLSX.utils.sheet_to_json(worksheet);
        const jugadoresConFechaConvertida = jugadores.map((jugador) => {
            return {
                rut: jugador.rut || 'No dato',
                nombre: jugador.nombre || 'No dato',
                materno: jugador.materno || 'No dato',
                paterno: jugador.paterno || 'No dato',
                fecha_nacimiento: jugador.fecha_nacimiento || 'No dato',
                fecha_inscripcion: jugador.fecha_inscripcion || '2024-08-20'
            };
        });
        const resultado = await this.jugadoresService.importarJugadores(jugadoresConFechaConvertida);
        return resultado;
    }
    async buscarPorRut(rut) {
        const jugador = await this.jugadoresService.buscarPorRut(rut);
        if (!jugador) {
            throw new common_1.NotFoundException('Jugador no encontrado');
        }
        return jugador;
    }
    async buscarPorClub(club_deportivo, req) {
        const user = req.user;
        if (user.role === 'dirigente' && !user.region) {
            throw new common_1.UnauthorizedException('Access denied: Region is required for dirigente');
        }
        const jugadores = await this.jugadoresService.buscarPorClub(club_deportivo, user.region);
        if (jugadores.length === 0) {
            throw new common_1.NotFoundException('No se encontraron jugadores para el club deportivo especificado');
        }
        return jugadores;
    }
    convertirFechaExcel(fechaExcel) {
        if (!fechaExcel || isNaN(fechaExcel)) {
            return '2023-08-20';
        }
        const fechaBase = new Date(1900, 0, fechaExcel - 1);
        fechaBase.setDate(fechaBase.getDate() + 1);
        return fechaBase.toISOString().split('T')[0];
    }
    async uploadFile(file, id) {
        return { message: 'Imagen subida exitosamente', filename: file.filename };
    }
    getPhotoByJugadorId(id, res) {
        const directoryPath = (0, path_1.join)(process.cwd(), 'uploads/jugadores');
        console.log('Directory Path:', directoryPath);
        console.log('Player ID:', id);
        if (!fs.existsSync(directoryPath)) {
            console.error('Directory does not exist');
            return res.status(404).json({ message: 'Directory does not exist' });
        }
        const files = fs.readdirSync(directoryPath);
        console.log('Files in Directory:', files);
        const playerImage = files.find((file) => {
            console.log('Checking file:', file);
            return file.startsWith(id.toString());
        });
        if (playerImage) {
            console.log('Player Image Found:', playerImage);
            const filePath = (0, path_1.join)(directoryPath, playerImage);
            return res.sendFile(filePath);
        }
        else {
            console.error('Image not found for player ID:', id);
            return res.status(404).json({ message: 'Imagen no encontrada para el jugador' });
        }
    }
    async updatePlayer(id, file, updatePlayerDto) {
        let imagePath;
        if (file) {
            imagePath = `uploads/jugadores/${file.filename}`;
        }
        const updatedPlayer = await this.jugadoresService.updatePlay(id, updatePlayerDto);
        return {
            message: 'Jugador updated successfully',
            player: {
                ...updatedPlayer,
                imagePath: imagePath || updatedPlayer.foto,
            },
        };
    }
    async upload(file) {
        if (!file || !file.originalname.endsWith('.xlsx')) {
            return { message: 'Por favor, sube un archivo Excel válido.' };
        }
        const { mainData, referenceData } = this.jugadoresService.processExcel(file.buffer);
        const filledData = this.jugadoresService.fillMissingData(mainData, referenceData);
        return filledData;
    }
    async uploadPhoto(id, file) {
        const filePath = `uploads/${file.filename}`;
        await this.jugadoresService.updateJugadorPhoto(id, filePath);
        return { filePath };
    }
};
exports.JugadoresController = JugadoresController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_jugador_dto_1.CreateJugadorDto]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('duplicados'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicados", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', { storage })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_jugador_dto_1.CreateJugadorDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "createPlayer", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('obtener'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationDto_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getPlayers", null);
__decorate([
    (0, common_1.Post)('excel'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/jugadores',
            filename: (req, file, callback) => {
                const filename = `${Date.now()}-${file.originalname}`;
                callback(null, filename);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "importExcel", null);
__decorate([
    (0, common_1.Get)('l'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getJugadores", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getJugadorPorId", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_jugador_dto_1.UpdateJugadorDto]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, cb) => {
                const filename = `${Date.now()}-${file.originalname}`;
                cb(null, filename);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "importarJugadores", null);
__decorate([
    (0, common_1.Get)('buscar/:rut'),
    __param(0, (0, common_1.Param)('rut')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "buscarPorRut", null);
__decorate([
    (0, common_1.UseGuards)(jwt_strategy_1.JwtStrategy),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('buscarEquipo/:club_deportivo'),
    __param(0, (0, common_1.Param)('club_deportivo')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "buscarPorClub", null);
__decorate([
    (0, common_1.Post)('upload/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/jugadores',
            filename: (req, file, cb) => {
                const filename = `${req.params.id}-${Date.now()}-${file.originalname}`;
                cb(null, filename);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('photo/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "getPhotoByJugadorId", null);
__decorate([
    (0, common_1.Put)('update/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/jugadores',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const extension = (0, path_1.extname)(file.originalname);
                callback(null, `${req.params.id}-${uniqueSuffix}${extension}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, update_jugador_dto_1.UpdateJugadorDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "updatePlayer", null);
__decorate([
    (0, common_1.Post)('uploads'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)(':id/uploadPhoto'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const filename = `${Date.now()}${path.extname(file.originalname)}`;
                callback(null, filename);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "uploadPhoto", null);
exports.JugadoresController = JugadoresController = __decorate([
    (0, common_1.Controller)('jugadores'),
    __param(1, (0, typeorm_1.InjectRepository)(jugador_entity_1.Jugador)),
    __metadata("design:paramtypes", [jugador_service_1.JugadoresService,
        typeorm_2.Repository])
], JugadoresController);
//# sourceMappingURL=jugador.controller.js.map