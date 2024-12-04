import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateJugadorDto {
   

  @IsNotEmpty()
  @IsString()
  rut: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsString()
  paterno: string;

  @IsNotEmpty()
  @IsString()
  materno: string;

  @IsNotEmpty()
  @IsString()
  fecha_nacimiento: string;


  @IsNotEmpty()
  @IsString()
  fecha_inscripcion: string;

  @IsOptional()
  @IsString()
  foto?: string;
  
  @IsOptional()
  duplicado?: number;

  @IsOptional()
  @IsBoolean()
  sancionado?:boolean;

  @IsOptional()
  recalificado?:boolean;

  @IsOptional()
  clubId: number;
}

