export interface JugadorResponseDto {
    id: number;
    paterno: string;
    materno: string;
    nombre: string;
    rut: string;
    fecha_nacimiento: Date;
    fecha_inscripcion: Date;
    sancionado: boolean;
    duplicado: boolean;
    recalificado: boolean;
    club: {
        id: number;
        name: string;
        asociacion: {
            id: number;
            name: string;
            region: {
                id: number;
                name: string;
            };
        };
    };
}
