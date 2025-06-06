export declare class CrearJugadorDto {
    rut: string;
    nombre: string;
    paterno: string;
    materno: string;
    fecha_nacimiento?: Date;
    fecha_inscripcion?: string;
    foto?: string;
    sancionado: boolean;
    recalificado?: boolean;
    duplicado?: number;
    clubId: number;
}
