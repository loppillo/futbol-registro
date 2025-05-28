"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express = require("express");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_2.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix("api/v1");
    app.enableCors({
        origin: ['https://fenfurnacional.cl', 'http://localhost:4000', 'https://fenfurnacional.com', 'https://www.fenfurnacional.cl', 'http://localhost:4200', 'http://www.fenfurnacional.cl'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.use('/uploads', express.static((0, path_1.join)(__dirname, '..', 'uploads')));
    await app.listen(4000);
}
bootstrap();
//# sourceMappingURL=main.js.map