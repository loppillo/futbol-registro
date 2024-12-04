"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsociacionModule = void 0;
const common_1 = require("@nestjs/common");
const asociacion_service_1 = require("./asociacion.service");
const asociacion_controller_1 = require("./asociacion.controller");
const region_entity_1 = require("../../region/region/entities/region.entity");
const club_entity_1 = require("../../club/club/entities/club.entity");
const typeorm_1 = require("@nestjs/typeorm");
const asociacion_entity_1 = require("./entities/asociacion.entity");
let AsociacionModule = class AsociacionModule {
};
exports.AsociacionModule = AsociacionModule;
exports.AsociacionModule = AsociacionModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([region_entity_1.Region]), typeorm_1.TypeOrmModule.forFeature([club_entity_1.Club]), typeorm_1.TypeOrmModule.forFeature([asociacion_entity_1.Asociacion])],
        controllers: [asociacion_controller_1.AsociacionController],
        providers: [asociacion_service_1.AsociacionService],
    })
], AsociacionModule);
//# sourceMappingURL=asociacion.module.js.map