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
    origin: ['https://fenfurnacional.cl', 'https://fenfurnacional.com'], // Dominios permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    allowedHeaders: 'Content-Type,Authorization', // Cabeceras permitidas
    credentials: true, // Permite que se envíen cookies de sesión
  });
  
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  
  

  

  await app.listen(4000); 


}
bootstrap();
