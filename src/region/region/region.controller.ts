import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseInterceptors, UploadedFile, NotFoundException, Put } from '@nestjs/common';
import { RegionService } from './region.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import * as XLSX from 'xlsx';
@Controller('region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionService.create(createRegionDto);
  }

  @Get()
  findAll() {
    return this.regionService.findAll();
  }

  @Get(':id')
  async obtenerRPorId(@Param('id') id: number) {
    const jugador = await this.regionService.findRegionById(id);
    if (!jugador) {
      throw new NotFoundException(`Región con ID ${id} no encontrado`);
    }
    return jugador;
  }
 
  @Put(':id')
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionService.update(+id, updateRegionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionService.delete(+id);
  }

  @Post('bulk-create')
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const regions = XLSX.utils.sheet_to_json(sheet);
    console.log('Parsed regions:', regions); // Verifica la estructura aquí

    if (!Array.isArray(regions)) {
      throw new BadRequestException('Invalid file format. Expected an array.');
    }

    // Procesa las regiones si es un array
    return { message: 'Regiones importadas', data: regions };
  }
}



