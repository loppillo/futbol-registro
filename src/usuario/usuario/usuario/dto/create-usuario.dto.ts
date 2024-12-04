// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, MinLength, IsArray, IsOptional, IsNotEmpty } from 'class-validator';


export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
  
  
  
}

