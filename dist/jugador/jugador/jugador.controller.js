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
exports.JugadoresController = exports.ActualizacionMasivaDto = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = require("fs");
const sharp = require("sharp");
const tesseract_js_1 = require("tesseract.js");
const jugador_service_1 = require("./jugador.service");
const create_jugador_dto_1 = require("./dto/create-jugador.dto");
const PaginationDto_dto_1 = require("./dto/PaginationDto.dto");
const class_validator_1 = require("class-validator");
class ActualizacionMasivaDto {
}
exports.ActualizacionMasivaDto = ActualizacionMasivaDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ActualizacionMasivaDto.prototype, "ids", void 0);
const playerStorage = (0, multer_1.diskStorage)({
    destination: './uploads/players',
    filename: (_req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `player-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
    },
});
const imageFileFilter = (_req, file, callback) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(new common_1.BadRequestException('Solo se permiten formatos .png, .jpg y .jpeg'), false);
    }
    callback(null, true);
};
let JugadoresController = class JugadoresController {
    constructor(jugadoresService) {
        this.jugadoresService = jugadoresService;
    }
    async createPlayer(file, playerData) {
        const player = await this.jugadoresService.createPlayer(playerData, file);
        return {
            message: 'Jugador creado con éxito',
            player,
        };
    }
    async updatePlayer(id, file, updateJugadorDto) {
        const updatedPlayer = await this.jugadoresService.updatePlay(id, updateJugadorDto, file);
        return {
            message: 'Jugador actualizado con éxito',
            player: updatedPlayer,
        };
    }
    async getPlayers(paginationDto, req) {
        const user = req.user;
        return this.jugadoresService.findAll(paginationDto, user);
    }
    async getJugadoresPaginated(page = 1, limit = 10) {
        return this.jugadoresService.findAll({ page, limit }, undefined);
    }
    async obtenerDuplicados(paginationDto) {
        return this.jugadoresService.obtenerDuplicados(paginationDto);
    }
    async obtenerDuplicadosExcel() {
        return this.jugadoresService.obtenerDuplicados({
            page: 1,
            limit: 10000,
        });
    }
    async buscarPorRut(rut) {
        const jugador = await this.jugadoresService.buscarPorRut(rut);
        if (!jugador) {
            throw new common_1.NotFoundException('Jugador no encontrado');
        }
        return jugador;
    }
    async buscarPorClub(clubDeportivo, req) {
        const user = req.user;
        const regionName = user?.region?.name || user?.regionName || '';
        return this.jugadoresService.findAll({
            clubName: clubDeportivo,
            regionName,
            page: 1,
            limit: 1000,
        });
    }
    async getJugadorPorId(id) {
        return await this.jugadoresService.findOne(id);
    }
    remove(id) {
        return this.jugadoresService.deletePlay(id);
    }
    volver(id) {
        return this.jugadoresService.volverPlay(id);
    }
    async eliminarMasivo(ids) {
        if (!ids || ids.length === 0) {
            throw new common_1.BadRequestException('Debe proporcionar al menos un ID para eliminar.');
        }
        return await this.jugadoresService.deleteMany(ids);
    }
    async importExcel(file) {
        if (!file) {
            throw new common_1.BadRequestException('Se requiere un archivo Excel.');
        }
        return await this.jugadoresService.importFromExcel(file.path);
    }
    async validarRutImagen(foto) {
        if (!foto) {
            throw new common_1.BadRequestException('Debe subir una imagen del carnet.');
        }
        try {
            const imagenProcesada = await sharp(foto.buffer)
                .resize({ width: 1400, withoutEnlargement: true })
                .grayscale()
                .linear(1.3, -15)
                .sharpen()
                .toFormat('jpeg', { quality: 90 })
                .toBuffer();
            const { data } = await (0, tesseract_js_1.recognize)(imagenProcesada, 'spa');
            const rutsValidos = this.extraerYValidarRuts(data.text);
            for (const rutFormateado of rutsValidos) {
                const jugador = await this.jugadoresService.buscarPorRut(rutFormateado);
                if (!jugador) {
                    return {
                        mensaje: 'RUT válido y no registrado',
                        rut: rutFormateado,
                    };
                }
                else {
                    return {
                        mensaje: 'RUT válido y registrado',
                        rut: rutFormateado,
                        nombreCompleto: `${jugador.nombre || ''} ${jugador.paterno || ''} ${jugador.materno || ''}`.trim(),
                        nombre: jugador.nombre,
                        paterno: jugador.paterno,
                        sancionado: jugador.sancionado,
                        recalificado: jugador.recalificado,
                        materno: jugador.materno,
                        club: jugador.club?.name || 'Sin Club',
                        asociacion: jugador.club?.asociacion?.name || 'Sin Asociación',
                        region: jugador.club?.asociacion?.region?.name || 'Sin Región',
                    };
                }
            }
            return {
                mensaje: 'No se encontró un RUT válido en la imagen',
                posiblesRuts: rutsValidos,
            };
        }
        catch (error) {
            console.log('Error detallado en validarRutImagen:', error);
            throw new common_1.InternalServerErrorException(`Error al procesar la imagen del carnet: ${error || error}`);
        }
    }
    async getPhotoByJugadorId(id, res) {
        try {
            const directoryPath = (0, path_1.join)(process.cwd(), 'uploads/players');
            if (!fs.existsSync(directoryPath)) {
                return res.status(404).json({ message: 'Directorio no existe' });
            }
            const files = fs.readdirSync(directoryPath);
            const playerImage = files.find((file) => file.includes(`player-${id}-`));
            if (playerImage) {
                return res.sendFile((0, path_1.join)(directoryPath, playerImage));
            }
            else {
                return res.status(404).json({ message: 'Imagen no encontrada' });
            }
        }
        catch (error) {
            return res.status(500).json({ message: 'Error en el servidor' });
        }
    }
    extraerYValidarRuts(texto) {
        const rutsEncontrados = new Set();
        const textoLimpio = texto
            .toUpperCase()
            .replace(/[\’\'\`\´\“\”\/\$\%\*\:\;\<\>]/g, ' ')
            .replace(/\s+/g, ' ');
        const regexRut = /(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}|\d{7,8})[-_\s]?([\dK])/g;
        const coincidencias = [...textoLimpio.matchAll(regexRut)];
        for (const match of coincidencias) {
            const cuerpo = match[1].replace(/[^\d]/g, '');
            const dvLeido = match[2].toUpperCase();
            if (cuerpo.length >= 7 && cuerpo.length <= 8) {
                if (this.validarRutModulo11(cuerpo, dvLeido)) {
                    rutsEncontrados.add(this.formatearRutConPuntos(`${cuerpo}-${dvLeido}`));
                }
                else {
                    const dvCalculado = this.obtenerDvModulo11(cuerpo);
                    rutsEncontrados.add(this.formatearRutConPuntos(`${cuerpo}-${dvCalculado}`));
                }
            }
        }
        return Array.from(rutsEncontrados);
    }
    obtenerDvModulo11(cuerpo) {
        let suma = 0;
        let multiplicador = 2;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        const resto = 11 - (suma % 11);
        if (resto === 11)
            return '0';
        if (resto === 10)
            return 'K';
        return resto.toString();
    }
    validarRutModulo11(cuerpo, dvIngresado) {
        return this.obtenerDvModulo11(cuerpo) === dvIngresado.toUpperCase();
    }
    formatearRutConPuntos(rut) {
        const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
        if (limpio.length < 2)
            return rut;
        const cuerpo = limpio.slice(0, -1);
        const dv = limpio.slice(-1);
        const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${conPuntos}-${dv}`;
    }
    async marcarComoDuplicadosMasivo(dto) {
        return await this.jugadoresService.marcarComoDuplicadosMasivo(dto.ids);
    }
    async restaurarMasivo(dto) {
        return await this.jugadoresService.restaurarMasivo(dto.ids);
    }
    async obtenerDuplicadosPorRegion(regionId, paginationDto) {
        return this.jugadoresService.obtenerDuplicadosPorRegion(regionId, paginationDto);
    }
};
exports.JugadoresController = JugadoresController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: playerStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: imageFileFilter,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_jugador_dto_1.CreateJugadorDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "createPlayer", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: playerStorage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: imageFileFilter,
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "updatePlayer", null);
__decorate([
    (0, common_1.Get)('obtener'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationDto_dto_1.PaginationDto, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getPlayers", null);
__decorate([
    (0, common_1.Get)('l'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getJugadoresPaginated", null);
__decorate([
    (0, common_1.Get)('duplicados'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaginationDto_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicados", null);
__decorate([
    (0, common_1.Get)('duplicados/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicadosExcel", null);
__decorate([
    (0, common_1.Get)('buscar/:rut'),
    __param(0, (0, common_1.Param)('rut')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "buscarPorRut", null);
__decorate([
    (0, common_1.Get)('buscarEquipo/:club_deportivo'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('club_deportivo')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "buscarPorClub", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getJugadorPorId", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('volver/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "volver", null);
__decorate([
    (0, common_1.Post)('eliminar-masivo'),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "eliminarMasivo", null);
__decorate([
    (0, common_1.Post)('excel'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/jugadores',
            filename: (_req, file, callback) => {
                callback(null, `${Date.now()}-${file.originalname}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "importExcel", null);
__decorate([
    (0, common_1.Post)('validar-rut-imagen'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "validarRutImagen", null);
__decorate([
    (0, common_1.Get)('photo/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "getPhotoByJugadorId", null);
__decorate([
    (0, common_1.Patch)('marcar-duplicados-masivo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ActualizacionMasivaDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "marcarComoDuplicadosMasivo", null);
__decorate([
    (0, common_1.Patch)('restaurar-masivo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ActualizacionMasivaDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "restaurarMasivo", null);
__decorate([
    (0, common_1.Get)('duplicados/region/:regionId'),
    __param(0, (0, common_1.Param)('regionId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PaginationDto_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicadosPorRegion", null);
exports.JugadoresController = JugadoresController = __decorate([
    (0, common_1.Controller)('jugadores'),
    __metadata("design:paramtypes", [jugador_service_1.JugadoresService])
], JugadoresController);
//# sourceMappingURL=jugador.controller.js.map