import { Club } from "src/club/club/entities/club.entity";
import { Region } from "src/region/region/entities/region.entity";
export declare class Asociacion {
    id: number;
    name: string;
    region: Region;
    clubs: Club[];
}
