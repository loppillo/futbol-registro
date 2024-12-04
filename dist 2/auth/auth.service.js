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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs = require("bcryptjs");
const usuario_service_1 = require("../usuario/usuario/usuario/usuario.service");
const typeorm_1 = require("@nestjs/typeorm");
const region_entity_1 = require("../region/region/entities/region.entity");
const typeorm_2 = require("typeorm");
let AuthService = class AuthService {
    constructor(usersService, jwtService, regionRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.regionRepository = regionRepository;
    }
    async register({ name, email, password, regionId, role }) {
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            throw new common_1.BadRequestException('User already exists');
        }
        const region = await this.regionRepository.findOne({ where: { id: regionId } });
        if (!region) {
            throw new common_1.BadRequestException('Region not found');
        }
        const newUser = await this.usersService.create({
            name,
            email,
            password: await bcryptjs.hash(password, 10),
            region,
            role,
        });
        return {
            name: newUser.name,
            email: newUser.email,
            region: newUser.region.name,
            role: newUser.role,
        };
    }
    async login({ email, password }) {
        const user = await this.usersService.findByEmailWithPassword(email);
        if (!user) {
            throw new common_1.UnauthorizedException('email is wrong');
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('password is wrong');
        }
        const payload = { email: user.email, role: user.role, region: user.region?.name };
        const token = await this.jwtService.signAsync(payload);
        return {
            access_token: token,
            email: user.email,
            role: user.role,
            region: user.region?.name,
        };
    }
    async profile({ email, role }) {
        return await this.usersService.findOneByEmail(email);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(region_entity_1.Region)),
    __metadata("design:paramtypes", [usuario_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map