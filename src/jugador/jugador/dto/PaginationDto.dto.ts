import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  paterno?: string;

  @IsOptional()
  @IsString()
  materno?: string;

  @IsOptional()
  @IsString()
  clubName?: string;

  @IsOptional()
  @IsString()
  asociacionName?: string;

  @IsOptional()
  @IsString()
  regionName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  regionId?: number;

  @IsOptional()
  @IsString()
  search?: string;
}