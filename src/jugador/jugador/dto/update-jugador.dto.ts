import { PartialType } from '@nestjs/mapped-types';
import { CreateJugadorDto } from './create-jugador.dto';
import { CrearJugadorDto } from './crearJugador.dto';

export class UpdateJugadorDto extends PartialType(CrearJugadorDto) {}
