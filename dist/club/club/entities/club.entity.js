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
exports.Club = void 0;
const asociacion_entity_1 = require("../../../asociacion/asociacion/entities/asociacion.entity");
const jugador_entity_1 = require("../../../jugador/jugador/entities/jugador.entity");
const typeorm_1 = require("typeorm");
let Club = class Club {
};
exports.Club = Club;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Club.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Club.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asociacion_entity_1.Asociacion, (Asociacion) => Asociacion.clubs),
    __metadata("design:type", asociacion_entity_1.Asociacion)
], Club.prototype, "asociacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => jugador_entity_1.Jugador, (player) => player.club),
    __metadata("design:type", Array)
], Club.prototype, "jugadores", void 0);
exports.Club = Club = __decorate([
    (0, typeorm_1.Entity)()
], Club);
//# sourceMappingURL=club.entity.js.map