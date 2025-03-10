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
exports.ClubService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const club_entity_1 = require("./entities/club.entity");
const typeorm_2 = require("@nestjs/typeorm");
const region_entity_1 = require("../../region/region/entities/region.entity");
const asociacion_entity_1 = require("../../asociacion/asociacion/entities/asociacion.entity");
const XLSX = require("xlsx");
let ClubService = class ClubService {
    constructor(clubRepo, regionRepo, associationRepo) {
        this.clubRepo = clubRepo;
        this.regionRepo = regionRepo;
        this.associationRepo = associationRepo;
    }
    async findAll() {
        return this.clubRepo.find({ relations: ['asociacion'] });
    }
    async create(data) {
        const club = this.clubRepo.create(data);
        return this.clubRepo.save(club);
    }
    async update(id, data) {
        await this.clubRepo.update(id, data);
        return this.clubRepo.findOneBy({ id });
    }
    async delete(id) {
        await this.clubRepo.delete(id);
    }
    async importClubsFromExcel(filePath) {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (data.length === 0) {
            console.warn('El archivo Excel está vacío.');
            return { message: 'No hay registros para importar.' };
        }
        for (const [index, row] of data.entries()) {
            try {
                const requiredFields = ['region', 'asociacion', 'club'];
                const missingFields = requiredFields.filter(field => !row[field]);
                if (missingFields.length) {
                    console.warn(`Fila ${index + 1}: Faltan campos esenciales: ${missingFields.join(', ')}`);
                    continue;
                }
                console.log(`Procesando fila ${index + 1}: ${JSON.stringify(row)}`);
                const region = await this.regionRepo.findOne({ where: { name: row['region'] } });
                if (!region) {
                    console.warn(`Fila ${index + 1}: Región no encontrada: ${row['region']}`);
                    continue;
                }
                const asociacion = await this.associationRepo.findOne({
                    where: {
                        name: row['asociacion'],
                        region: { id: region.id },
                    },
                });
                if (!asociacion) {
                    console.warn(`Fila ${index + 1}: Asociación no encontrada en la región: ${row['asociacion']}`);
                    continue;
                }
                let club = await this.clubRepo.findOne({ where: { name: row['club'], asociacion: { id: asociacion.id } } });
                if (club) {
                    console.log(`Fila ${index + 1}: El club ya existe: ${row['club']}`);
                    continue;
                }
                club = this.clubRepo.create({
                    name: row['club'],
                    asociacion: asociacion,
                });
                await this.clubRepo.save(club);
                console.log(`Fila ${index + 1}: Club guardado exitosamente: ${club.name}`);
            }
            catch (error) {
                console.error(`Error en fila ${index + 1}: ${error.message}`);
            }
        }
        return { message: 'Importación completada exitosamente' };
    }
};
exports.ClubService = ClubService;
exports.ClubService = ClubService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(club_entity_1.Club)),
    __param(1, (0, typeorm_2.InjectRepository)(region_entity_1.Region)),
    __param(2, (0, typeorm_2.InjectRepository)(asociacion_entity_1.Asociacion)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], ClubService);
//# sourceMappingURL=club.service.js.map