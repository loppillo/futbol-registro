import { Club } from 'src/club/club/entities/club.entity';
export declare class Jugador {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
    rut: string;
    fecha_nacimiento: Date;
    fecha_inscripcion: Date;
    foto: string;
    sancionado: boolean;
    recalificado: boolean;
    duplicado: number;
    club: Club;
}
