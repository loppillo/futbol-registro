import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class CrearJugadorDto {

  @IsString()
  @IsNotEmpty()
  rut: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  paterno: string;

  @IsString()
  @IsNotEmpty()
  materno: string;

  @IsDateString()
  fecha_nacimiento: string;

  @IsDateString()
  fecha_inscripcion: string;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsBoolean()
  sancionado:boolean;

  @IsOptional()
  @IsBoolean()
  recalificado:boolean;

  @IsOptional()
  duplicado?: number;

  @IsNotEmpty({ message: 'El clubId es obligatorio.' })
  @IsNumber({}, { message: 'El clubId debe ser un número válido.' })
  clubId: number;


}


