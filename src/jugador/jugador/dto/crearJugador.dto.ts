import { Transform, TransformFnParams } from "class-transformer";
import { IsBoolean, IsDate, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
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
   @IsString()
  fecha_inscripcion?: string;

  @IsOptional()
  @IsString()
  foto?: string;


  @Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      const val = value.toLowerCase();
      if (val === 'true') return true;
      if (val === 'false') return false;
    }
    return Boolean(value);
  })
  @IsOptional()
  sancionado: boolean;

  @Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      const val = value.toLowerCase();
      if (val === 'true') return true;
      if (val === 'false') return false;
    }
    return Boolean(value);
  })
  @IsBoolean()
  @IsOptional()
  recalificado?: boolean;

  @IsOptional()
  duplicado?: number;

  @IsNotEmpty({ message: 'El clubId es obligatorio.' })
  @IsNumber({}, { message: 'El clubId debe ser un número válido.' })
  clubId: number;


}


