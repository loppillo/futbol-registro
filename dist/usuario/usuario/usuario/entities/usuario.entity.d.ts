import { Region } from "src/region/region/entities/region.entity";
export declare class User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    deletedAt: Date;
    region: Region;
    regio: string;
}
