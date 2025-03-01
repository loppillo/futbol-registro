import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import { Logger } from '@nestjs/common';

async function bootstrap() {

const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix("api/v1");
  app.enableCors();
  
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  
  

  

  await app.listen(4000); 


}
bootstrap();
