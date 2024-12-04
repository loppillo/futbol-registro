"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRegionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_region_dto_1 = require("./create-region.dto");
class UpdateRegionDto extends (0, mapped_types_1.PartialType)(create_region_dto_1.CreateRegionDto) {
}
exports.UpdateRegionDto = UpdateRegionDto;
//# sourceMappingURL=update-region.dto.js.map