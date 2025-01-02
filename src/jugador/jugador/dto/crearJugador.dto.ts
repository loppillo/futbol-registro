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

  @IsOptional()
  @IsDateString({ strict: true })
  fecha_nacimiento?: Date;

  @IsOptional()
  @IsDateString({ strict: true })
  fecha_inscripcion?: Date;

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


