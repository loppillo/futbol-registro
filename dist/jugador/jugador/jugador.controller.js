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
const sharp = require("sharp");
const auth_guard_1 = require("../../auth/guard/auth.guard");
const jwt_strategy_1 = require("../../auth/jwt.strategy");
const Tesseract = require('tesseract.js');
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
    async Player(file, playerData) {
        if (!file)
            throw new common_1.BadRequestException('Se requiere una imagen');
        const imagePath = `/players/${file.filename}`;
        playerData.foto = imagePath;
        const player = await this.jugadoresService.create(playerData);
        return { message: 'Jugador creado con éxito', player };
    }
    async obtenerDuplicados(page = 1, limit = 10) {
        const pageNumber = isNaN(Number(page)) ? 1 : Number(page);
        const limitNumber = isNaN(Number(limit)) ? 10 : Number(limit);
        const skip = (pageNumber - 1) * limitNumber;
        return this.jugadoresService.obtenerDuplicados(page, limit);
    }
    async obtenerDuplicadosExcel() {
        return this.jugadoresService.obtenerDuplicadosSinPaginacion();
    }
    async createPlayer(file, playerData) {
        if (!file) {
            throw new common_1.BadRequestException('Se requiere una imagen para crear el jugador.');
        }
        const imagePath = `https://fenfurnacional.com/uploads/players/${file.filename}`;
        const player = await this.jugadoresService.createPlayer({ ...playerData });
        return {
            message: 'Jugador creado con éxito',
            player,
            imageUrl: imagePath
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
    async upPlayer(id, file, updateJugadorDto) {
        let imageUrl = updateJugadorDto.foto;
        if (file) {
            const filePath = `uploads/players/${file.filename}`;
            imageUrl = `https://fenfurnacional.com/uploads/players/${file.filename}`;
            updateJugadorDto.foto = filePath;
            console.log(updateJugadorDto.foto);
        }
        const updatedPlayer = await this.jugadoresService.updatePlay(id, updateJugadorDto);
        return {
            message: 'Jugador actualizado con éxito',
            player: {
                ...updatedPlayer,
                foto: imageUrl
            },
        };
    }
    remove(id) {
        return this.jugadoresService.deletePlay(+id);
    }
    volver(id) {
        return this.jugadoresService.volverPlay(+id);
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
    async validarRutImagen(foto) {
        if (!foto) {
            throw new common_1.BadRequestException('Debe subir una imagen');
        }
        const imagenProcesada = await sharp(foto.buffer)
            .resize({ width: 400, withoutEnlargement: true })
            .grayscale()
            .normalize()
            .toBuffer();
        const imageBase64 = `data:image/jpeg;base64,${imagenProcesada.toString('base64')}`;
        const { data } = await Tesseract.recognize(imageBase64, 'spa');
        const posiblesRuts = this.extraerRuts(data.text);
        for (const posibleRut of posiblesRuts) {
            const rutFormateado = this.formatearRutConPuntos(posibleRut);
            if (rutFormateado) {
                const usuarioExistente = await this.jugadoresRepository.findOne({ where: { rut: rutFormateado } });
                if (!usuarioExistente) {
                    return { mensaje: 'RUT válido y no registrado', rut: rutFormateado };
                }
                else {
                    return { mensaje: 'RUT válido y registrado', rut: rutFormateado };
                }
            }
        }
        console.log('Posibles RUTs extraídos:', posiblesRuts);
        return { mensaje: 'No se encontró un RUT válido en la imagen', posiblesRuts: posiblesRuts.map(r => this.formatearRut(r)) };
    }
    extraerRuts(texto) {
        console.log('Texto extraído por OCR:', texto);
        const rutsSet = new Set();
        const runExtraido = this.extraerRunDelTexto(texto);
        if (runExtraido) {
            rutsSet.add(this.normalizarRut(runExtraido));
        }
        const formatoClasico = /\b\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]\b/g;
        const matchesClasico = texto.match(formatoClasico);
        if (matchesClasico) {
            matchesClasico.forEach(rut => rutsSet.add(this.normalizarRut(rut)));
        }
        const formatoSimple = /\b\d{7,8}-[0-9Kk]\b/g;
        const matchesSimple = texto.match(formatoSimple);
        if (matchesSimple) {
            matchesSimple.forEach(rut => rutsSet.add(this.normalizarRut(rut)));
        }
        const formatoSinGuion = /\b\d{7,8}[0-9Kk]\b/g;
        const matchesSinGuion = texto.match(formatoSinGuion);
        if (matchesSinGuion) {
            matchesSinGuion.forEach(r => {
                const cuerpo = r.slice(0, -1);
                const dv = r.slice(-1).toUpperCase();
                rutsSet.add(this.normalizarRut(`${cuerpo}-${dv}`));
            });
        }
        return Array.from(rutsSet);
    }
    extraerRunDelTexto(texto) {
        const regex = /(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3})[\s\-]?(\d|[Kk])/g;
        let match;
        while ((match = regex.exec(texto)) !== null) {
            let [, parteNumerica, dv] = match;
            const cuerpo = parteNumerica.replace(/[\.\s]/g, '');
            dv = dv.toUpperCase();
            return `${cuerpo}-${dv}`;
        }
        return null;
    }
    normalizarRut(rut) {
        rut = rut.replace(/\./g, '').replace(/-/g, '');
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();
        return `${cuerpo}-${dv}`;
    }
    validarRutChileno(rut) {
        const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
        const cuerpo = rutLimpio.slice(0, -1);
        const dv = rutLimpio.slice(-1);
        let suma = 0;
        let multiplo = 2;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i)) * multiplo;
            multiplo = multiplo < 7 ? multiplo + 1 : 2;
        }
        const dvEsperado = 11 - (suma % 11);
        const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
        if (dv === dvCalculado) {
            return this.formatearRut(cuerpo);
        }
        else {
            return false;
        }
    }
    formatearRut(rutNormalizado) {
        if (!rutNormalizado.includes('-')) {
            console.warn('RUT malformado recibido en formatearRut:', rutNormalizado);
            return rutNormalizado;
        }
        const [cuerpo, dv] = rutNormalizado.split('-');
        if (!cuerpo || !dv) {
            console.warn('Cuerpo o dígito verificador inválido:', rutNormalizado);
            return rutNormalizado;
        }
        let cuerpoFormateado = '';
        let contador = 0;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
            contador++;
            if (contador % 3 === 0 && i !== 0) {
                cuerpoFormateado = '.' + cuerpoFormateado;
            }
        }
        return `${cuerpoFormateado}-${dv.toUpperCase()}`;
    }
    formatearRutConPuntos(rut) {
        rut = rut.replace(/\./g, '').replace(/-/g, '');
        if (rut.length < 2) {
            console.warn('RUT demasiado corto:', rut);
            return rut;
        }
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1).toUpperCase();
        let cuerpoFormateado = '';
        let contador = 0;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
            contador++;
            if (contador % 3 === 0 && i !== 0) {
                cuerpoFormateado = '.' + cuerpoFormateado;
            }
        }
        return `${cuerpoFormateado}-${dv}`;
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
    async getPhotoByJugadorId(id, res) {
        try {
            const directoryPath = (0, path_1.join)(process.cwd(), 'uploads/players');
            console.log('Path de la carpeta:', directoryPath);
            console.log('ID del jugador:', id);
            if (!fs.existsSync(directoryPath)) {
                console.error('El directorio no existe:', directoryPath);
                return res.status(404).json({ message: 'Directorio no existe' });
            }
            const files = fs.readdirSync(directoryPath);
            console.log('Archivos en la carpeta:', files);
            const playerImage = files.find(file => file.includes(`player-${id}-`));
            if (playerImage) {
                console.log('Imagen encontrada:', playerImage);
                const filePath = (0, path_1.join)(directoryPath, playerImage);
                return res.sendFile(filePath);
            }
            else {
                console.error('Imagen no encontrada para el jugador con ID:', id);
                return res.status(404).json({ message: 'Imagen no encontrada' });
            }
        }
        catch (error) {
            console.error('Error general:', error);
            return res.status(500).json({ message: 'Error en el servidor' });
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
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/players',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const filename = `player-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`;
                callback(null, filename);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Only .png, .jpg and .jpeg formats are allowed'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_jugador_dto_1.CreateJugadorDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "Player", null);
__decorate([
    (0, common_1.Get)('duplicados'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicados", null);
__decorate([
    (0, common_1.Get)('duplicados/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "obtenerDuplicadosExcel", null);
__decorate([
    (0, common_1.Post)('creates'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/players',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `player-${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Only .png, .jpg and .jpeg formats are allowed'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_jugador_dto_1.CreateJugadorDto]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "createPlayer", null);
__decorate([
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
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/players',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                const filename = `player-${uniqueSuffix}${ext}`;
                callback(null, filename);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return callback(new common_1.BadRequestException('Solo se permiten archivos .png, .jpg y .jpeg'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "upPlayer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('/volver/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], JugadoresController.prototype, "volver", null);
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
    (0, common_1.Post)('validar-rut-imagen'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JugadoresController.prototype, "validarRutImagen", null);
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
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
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