export declare class CreateJugadorDto {
    rut: string;
    nombre: string;
    paterno: string;
    materno: string;
    fecha_nacimiento: string;
    fecha_inscripcion: string;
    foto?: string;
    duplicado?: number;
    sancionado?: boolean;
    recalificado?: boolean;
    clubId: number;
}
