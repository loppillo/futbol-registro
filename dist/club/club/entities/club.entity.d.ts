import { Asociacion } from "src/asociacion/asociacion/entities/asociacion.entity";
import { Jugador } from "src/jugador/jugador/entities/jugador.entity";
export declare class Club {
    id: number;
    name: string;
    asociacion: Asociacion;
    jugadores: Jugador[];
}
