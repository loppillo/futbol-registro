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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asociacion = void 0;
const club_entity_1 = require("../../../club/club/entities/club.entity");
const region_entity_1 = require("../../../region/region/entities/region.entity");
const typeorm_1 = require("typeorm");
let Asociacion = class Asociacion {
};
exports.Asociacion = Asociacion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Asociacion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Asociacion.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => region_entity_1.Region, (region) => region.asociaciones),
    __metadata("design:type", region_entity_1.Region)
], Asociacion.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => club_entity_1.Club, (club) => club.asociacion),
    __metadata("design:type", Array)
], Asociacion.prototype, "clubs", void 0);
exports.Asociacion = Asociacion = __decorate([
    (0, typeorm_1.Entity)()
], Asociacion);
//# sourceMappingURL=asociacion.entity.js.map