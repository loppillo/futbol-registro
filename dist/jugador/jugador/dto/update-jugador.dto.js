"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJugadorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const crearJugador_dto_1 = require("./crearJugador.dto");
class UpdateJugadorDto extends (0, mapped_types_1.PartialType)(crearJugador_dto_1.CrearJugadorDto) {
}
exports.UpdateJugadorDto = UpdateJugadorDto;
//# sourceMappingURL=update-jugador.dto.js.map