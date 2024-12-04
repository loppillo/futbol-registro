import { Repository } from 'typeorm';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { Jugador } from './entities/jugador.entity';
import { PaginationDto } from './dto/PaginationDto.dto';
import { JugadorResponseDto } from './dto/JugadorResponseDto.dto';
import { Club } from 'src/club/club/entities/club.entity';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Region } from 'src/region/region/entities/region.entity';
export interface ClubData {
    club: string;
    association?: string;
    region?: string;
}
export declare class JugadoresService {
    private readonly regionRepo;
    private readonly associationRepo;
    private readonly clubRepo;
    private readonly jugadoresRepository;
    private threshold;
    constructor(regionRepo: Repository<Region>, associationRepo: Repository<Asociacion>, clubRepo: Repository<Club>, jugadoresRepository: Repository<Jugador>);
    create(createJugadorDto: CreateJugadorDto): Promise<Jugador>;
    obtenerJugadorPorId(id: number): Promise<Jugador>;
    findAll(paginationDto: PaginationDto): Promise<{
        players: JugadorResponseDto[];
        total: number;
    }>;
    findOne(id: number): Promise<Jugador>;
    update(id: number, updateJugadorDto: UpdateJugadorDto): Promise<Jugador>;
    remove(id: number): Promise<void>;
    private convertirFechaExcel;
    importarJugadores(jugadores: any[]): Promise<any>;
    markDuplicates(): Promise<{
        message: string;
        duplicates: any[];
    }>;
    buscarPorRut(rut: string): Promise<Jugador | null>;
    buscarPorClub(club_deportivo: string, regionName: string): Promise<Jugador[]>;
    findAllPaginated(page: number, limit: number): Promise<{
        data: Jugador[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    updatePlayerImage(playerId: number, imagePath: string): Promise<Jugador>;
    createProductWithImage(id: number, foto: string): Promise<Jugador>;
    findPlayerById(id: number): Promise<Jugador>;
    findAllPlayers(): Promise<Jugador[]>;
    createPlayer(createPlayerDto: CreateJugadorDto, imagePath?: string): Promise<Jugador>;
    updatePlayer(id: number, updatePlayerDto: UpdateJugadorDto): Promise<Jugador>;
    updatePlay(id: number, updatePlayerDto: Partial<UpdateJugadorDto>, imagePath?: string): Promise<Jugador>;
    getAllPlayers(paginationDto: PaginationDto): Promise<void>;
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
    importFromExcel(filePath: string): Promise<{
        message: string;
    }>;
    processExcel(buffer: Buffer): {
        mainData: ClubData[];
        referenceData: ClubData[];
    };
    fillMissingData(mainData: ClubData[], referenceData: ClubData[]): ClubData[];
    private findClosestMatch;
    deletePlay(id: number): Promise<Jugador>;
    updateJugadorPhoto(id: number, filePath: string): Promise<void>;
}
