import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { Club } from './entities/club.entity';

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
}
