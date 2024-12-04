import { JugadoresService } from './jugador.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { Response } from 'express';
import { PaginationDto } from './dto/PaginationDto.dto';
import { JugadorResponseDto } from './dto/JugadorResponseDto.dto';
import { Jugador } from './entities/jugador.entity';
import { Repository } from 'typeorm';
export declare const Users: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class JugadoresController {
    private readonly jugadoresService;
    private jugadoresRepository;
    constructor(jugadoresService: JugadoresService, jugadoresRepository: Repository<Jugador>);
    create(createJugadorDto: CreateJugadorDto): Promise<Jugador>;
    obtenerDuplicados(page?: number, limit?: number): Promise<{
        jugadores: {
            id: number;
            nombre: string;
            paterno: string;
            materno: string;
            rut: string;
            fecha_nacimiento: Date;
            fecha_inscripcion: Date;
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
            sancionado: boolean;
            duplicado: number;
        }[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
    createPlayer(file: Express.Multer.File, playerData: CreateJugadorDto): Promise<{
        message: string;
        player: {
            imagePath: string;
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
            club: import("../../club/club/entities/club.entity").Club;
        };
    }>;
    getPlayers(paginationDto: PaginationDto): Promise<{
        players: JugadorResponseDto[];
        total: number;
    }>;
    importExcel(file: Express.Multer.File): Promise<{
        message: string;
    }>;
    getJugadores(page?: number, limit?: number): Promise<{
        data: Jugador[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getJugadorPorId(id: number): Promise<Jugador>;
    update(id: number, updateJugadorDto: UpdateJugadorDto): Promise<Jugador>;
    remove(id: number): Promise<Jugador>;
    importarJugadores(file: Express.Multer.File): Promise<any>;
    buscarPorRut(rut: string): Promise<Jugador>;
    buscarPorClub(club_deportivo: string, req: any): Promise<Jugador[]>;
    private convertirFechaExcel;
    uploadFile(file: Express.Multer.File, id: string): Promise<{
        message: string;
        filename: string;
    }>;
    getPhotoByJugadorId(id: number, res: Response): void | Response<any, Record<string, any>>;
    updatePlayer(id: number, file: Express.Multer.File, updatePlayerDto: UpdateJugadorDto): Promise<{
        message: string;
        player: {
            imagePath: string;
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
            club: import("../../club/club/entities/club.entity").Club;
        };
    }>;
    upload(file: Express.Multer.File): Promise<import("./jugador.service").ClubData[] | {
        message: string;
    }>;
    uploadPhoto(id: number, file: Express.Multer.File): Promise<{
        filePath: string;
    }>;
}
