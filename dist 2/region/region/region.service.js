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
exports.RegionService = void 0;
const common_1 = require("@nestjs/common");
const Repository_1 = require("typeorm/repository/Repository");
const region_entity_1 = require("./entities/region.entity");
const typeorm_1 = require("@nestjs/typeorm");
let RegionService = class RegionService {
    constructor(regionRepo) {
        this.regionRepo = regionRepo;
    }
    async findAll() {
        return this.regionRepo.find();
    }
    async create(data) {
        console.log('Creating region with data:', data);
        const region = this.regionRepo.create(data);
        const savedRegion = await this.regionRepo.save(region);
        console.log('Region created:', savedRegion);
        return savedRegion;
    }
    async update(id, data) {
        await this.regionRepo.update(id, data);
        return this.regionRepo.findOneBy({ id });
    }
    async delete(id) {
        await this.regionRepo.delete(id);
    }
    async bulkCreate(regions) {
        const newRegions = regions.map((region) => this.regionRepo.create({ name: region.name }));
        await this.regionRepo.save(newRegions);
    }
    async findRegionById(id) {
        return await this.regionRepo.findOne({ where: { id } });
    }
};
exports.RegionService = RegionService;
exports.RegionService = RegionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(region_entity_1.Region)),
    __metadata("design:paramtypes", [Repository_1.Repository])
], RegionService);
//# sourceMappingURL=region.service.js.map