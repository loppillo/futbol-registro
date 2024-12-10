import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Club } from './entities/club.entity';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as path from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';

@Controller('club')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Get()
  findAll(): Promise<Club[]> {
    return this.clubService.findAll();
  }

  @Post()
  create(@Body() clubData: Partial<Club>): Promise<Club> {
    return this.clubService.create(clubData);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Club>): Promise<Club> {
    return this.clubService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: number): Promise<void> {
    return this.clubService.delete(id);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/jugadores', // Custom folder for uploads
        filename: (req, file, callback) => {
          const filename = `${Date.now()}-${file.originalname}`;
          callback(null, filename); // Set the filename
        },
      }),
    }),
  )
  async importClubs(@UploadedFile() file: Express.Multer.File) {
    const imagePath = file.path;
    if (!fs.existsSync(imagePath)) {
      throw new BadRequestException('El archivo no existe en el servidor.');
    }
  
    try {
      // Procesa el archivo (llama a tu servicio)
      const result = await this.clubService.importClubsFromExcel(imagePath);
      return result;
    } catch (error) {
      throw new BadRequestException(`Error al importar: ${error.message}`);
    } // Get the correct path from the uploaded file
    
  }

}

