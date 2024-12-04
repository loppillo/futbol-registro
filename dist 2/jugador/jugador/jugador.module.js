"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JugadorModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jugador_entity_1 = require("./entities/jugador.entity");
const platform_express_1 = require("@nestjs/platform-express");
const club_entity_1 = require("../../club/club/entities/club.entity");
const region_entity_1 = require("../../region/region/entities/region.entity");
const asociacion_entity_1 = require("../../asociacion/asociacion/entities/asociacion.entity");
const jugador_controller_1 = require("./jugador.controller");
const jugador_service_1 = require("./jugador.service");
let JugadorModule = class JugadorModule {
};
exports.JugadorModule = JugadorModule;
exports.JugadorModule = JugadorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([jugador_entity_1.Jugador]),
            typeorm_1.TypeOrmModule.forFeature([club_entity_1.Club]),
            typeorm_1.TypeOrmModule.forFeature([region_entity_1.Region]),
            typeorm_1.TypeOrmModule.forFeature([asociacion_entity_1.Asociacion]),
            platform_express_1.MulterModule.register({
                dest: './uploads',
                limits: { fileSize: 10 * 1024 * 1024 },
            }),
        ],
        controllers: [jugador_controller_1.JugadoresController],
        providers: [
            jugador_service_1.JugadoresService,
        ],
    })
], JugadorModule);
//# sourceMappingURL=jugador.module.js.map