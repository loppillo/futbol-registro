import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Club } from './entities/club.entity';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as path from 'path';

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
  @UseInterceptors(FileInterceptor('file'))
  async importClubs(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }

    // Validar que sea un archivo Excel
    const validExtensions = ['.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname);
    if (!validExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'El archivo debe ser un documento Excel (.xls o .xlsx).',
      );
    }

    // Guardar temporalmente el archivo en el servidor
    const filePath = path.join(__dirname, '../../uploads', file.filename);

    try {
      // Llama al servicio para procesar el archivo
      const result = await this.clubService.importClubsFromExcel(filePath);
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Error al importar los datos: ${error.message}`,
      );
    } finally {
      // Elimina el archivo temporal después del procesamiento si es necesario
      // fs.unlinkSync(filePath);
    }
  }


}
