import { Asociacion } from "src/asociacion/asociacion/entities/asociacion.entity";
import { User } from "src/usuario/usuario/usuario/entities/usuario.entity";
export declare class Region {
    id: number;
    name: string;
    asociaciones: Asociacion[];
    users: User[];
}
