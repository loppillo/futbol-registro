import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { AsociacionService } from './asociacion.service';
import { CreateAsociacionDto } from './dto/create-asociacion.dto';
import { UpdateAsociacionDto } from './dto/update-asociacion.dto';
import { Asociacion } from './entities/asociacion.entity';

@Controller('asociacion')
export class AsociacionController {
  constructor(private readonly asociacionService: AsociacionService) {}

  @Get()
  findAll(): Promise<Asociacion[]> {
    return this.asociacionService.findAll();
  }

  @Post()
  create(@Body() asociacionData: Partial<Asociacion>): Promise<Asociacion> {
    return this.asociacionService.create(asociacionData);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: Partial<Asociacion>): Promise<Asociacion> {
    return this.asociacionService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: number): Promise<void> {
    return this.asociacionService.delete(id);
  }
}
