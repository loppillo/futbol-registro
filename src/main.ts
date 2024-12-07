import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {


  
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: 'https://fenfurnacional.cl', // Dominio permitido
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Cabeceras permitidas
  });
  
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  
  

  

  await app.listen(4000); 


}
bootstrap();
