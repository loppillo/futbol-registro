import { Response } from 'express';
import { JugadoresService } from './jugador.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { PaginationDto } from './dto/PaginationDto.dto';
import { Jugador } from './entities/jugador.entity';
export declare class ActualizacionMasivaDto {
    ids?: number[];
}
export declare class JugadoresController {
    private readonly jugadoresService;
    constructor(jugadoresService: JugadoresService);
    createPlayer(file: Express.Multer.File, playerData: CreateJugadorDto): Promise<{
        message: string;
        player: Jugador;
    }>;
    updatePlayer(id: number, file: Express.Multer.File, updateJugadorDto: Partial<UpdateJugadorDto>): Promise<{
        message: string;
        player: Jugador;
    }>;
    getPlayers(paginationDto: PaginationDto, req: any): Promise<{
        players: Jugador[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getJugadoresPaginated(page?: number, limit?: number): Promise<{
        players: Jugador[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    obtenerDuplicados(paginationDto: PaginationDto): Promise<{
        jugadores: Jugador[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
    obtenerDuplicadosExcel(): Promise<{
        jugadores: Jugador[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
    buscarPorRut(rut: string): Promise<Jugador>;
    buscarPorClub(clubDeportivo: string, req: any): Promise<{
        players: Jugador[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getJugadorPorId(id: number): Promise<Jugador>;
    remove(id: number): Promise<Jugador>;
    volver(id: number): Promise<Jugador>;
    eliminarMasivo(ids: number[]): Promise<{
        affected: number;
    }>;
    importExcel(file: Express.Multer.File): Promise<{
        message: string;
        totalFilas: number;
        creados: number;
        duplicados: number;
    }>;
    validarRutImagen(foto: Express.Multer.File): Promise<{
        mensaje: string;
        rut: string;
        nombreCompleto?: undefined;
        nombre?: undefined;
        paterno?: undefined;
        sancionado?: undefined;
        recalificado?: undefined;
        materno?: undefined;
        club?: undefined;
        asociacion?: undefined;
        region?: undefined;
        posiblesRuts?: undefined;
    } | {
        mensaje: string;
        rut: string;
        nombreCompleto: string;
        nombre: string;
        paterno: string;
        sancionado: boolean;
        recalificado: boolean;
        materno: string;
        club: string;
        asociacion: string;
        region: string;
        posiblesRuts?: undefined;
    } | {
        mensaje: string;
        posiblesRuts: string[];
        rut?: undefined;
        nombreCompleto?: undefined;
        nombre?: undefined;
        paterno?: undefined;
        sancionado?: undefined;
        recalificado?: undefined;
        materno?: undefined;
        club?: undefined;
        asociacion?: undefined;
        region?: undefined;
    }>;
    getPhotoByJugadorId(id: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    private extraerYValidarRuts;
    private obtenerDvModulo11;
    private validarRutModulo11;
    private formatearRutConPuntos;
    marcarComoDuplicadosMasivo(dto: ActualizacionMasivaDto): Promise<{
        message: string;
        registrosAfectados: number;
    }>;
    restaurarMasivo(dto: ActualizacionMasivaDto): Promise<{
        message: string;
        registrosAfectados: number;
    }>;
    obtenerDuplicadosPorRegion(regionId: number, paginationDto: PaginationDto): Promise<{
        jugadores: Jugador[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
