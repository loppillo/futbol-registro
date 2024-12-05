import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('cert/private-key.pem'),   // Ruta a tu clave privada
    cert: fs.readFileSync('cert/certificate.pem'),  // Ruta a tu certificado
  };

  const port = process.env.PORT || 4000;
  const app = await NestFactory.create(AppModule,{
    httpsOptions
  });
  
  app.setGlobalPrefix("api/v1");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      
    })
  );
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  await app.listen(port);
  
  

  

  await app.listen(3000); 


}
bootstrap();
