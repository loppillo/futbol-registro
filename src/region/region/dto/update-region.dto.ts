import { PartialType } from '@nestjs/mapped-types';
import { CreateRegionDto } from './create-region.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRegionDto  {
 

    @IsString()
    @IsNotEmpty()
    name: string;



}
