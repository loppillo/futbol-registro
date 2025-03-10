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
exports.ClubController = void 0;
const common_1 = require("@nestjs/common");
const club_service_1 = require("./club.service");
const multer_1 = require("@nestjs/platform-express/multer");
const fs = require("fs");
const multer_2 = require("multer");
let ClubController = class ClubController {
    constructor(clubService) {
        this.clubService = clubService;
    }
    findAll() {
        return this.clubService.findAll();
    }
    create(clubData) {
        return this.clubService.create(clubData);
    }
    update(id, data) {
        return this.clubService.update(id, data);
    }
    delete(id) {
        return this.clubService.delete(id);
    }
    async importClubs(file) {
        const imagePath = file.path;
        if (!fs.existsSync(imagePath)) {
            throw new common_1.BadRequestException('El archivo no existe en el servidor.');
        }
        try {
            const result = await this.clubService.importClubsFromExcel(imagePath);
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Error al importar: ${error.message}`);
        }
    }
};
exports.ClubController = ClubController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ClubController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, multer_1.FileInterceptor)('file', {
        storage: (0, multer_2.diskStorage)({
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
], ClubController.prototype, "importClubs", null);
exports.ClubController = ClubController = __decorate([
    (0, common_1.Controller)('club'),
    __metadata("design:paramtypes", [club_service_1.ClubService])
], ClubController);
//# sourceMappingURL=club.controller.js.map