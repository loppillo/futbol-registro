import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('/cert/private-key.pem'), // Cambia al archivo real
    cert: fs.readFileSync('/cert/certificate.pem'), // Cambia al archivo real
  };

  
  const app = await NestFactory.create(AppModule, { httpsOptions });
  
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: 'https://fenfurnacional.cl', // Dominio del frontend
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      
    })
  );
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  
  

  

  await app.listen(4000,'0.0.0.0'); 


}
bootstrap();
