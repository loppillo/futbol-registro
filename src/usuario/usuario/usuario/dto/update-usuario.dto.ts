import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-usuario.dto';


export class UpdateUsuarioDto extends PartialType(CreateUserDto) {}
