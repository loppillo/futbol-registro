import { IsOptional, IsInt, IsPositive, Min, IsString } from "class-validator";

export class PaginationDto {

   @IsOptional()
    page?: number = 1; // Default to page 1
  

   @IsOptional()    
    limit?: number = 10; // Default to 10 items per page

    @IsOptional()
    @IsString()
    rut?: string;


    @IsString() // ✅ Definimos club como una cadena de texto
    @IsOptional()
    clubName: string;
  }