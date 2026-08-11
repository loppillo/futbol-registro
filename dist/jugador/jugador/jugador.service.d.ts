import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Jugador } from './entities/jugador.entity';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Club } from 'src/club/club/entities/club.entity';
import { Region } from 'src/region/region/entities/region.entity';
import { PaginationDto } from './dto/PaginationDto.dto';
export declare class JugadoresService {
    private readonly regionRepo;
    private readonly associationRepo;
    private readonly clubRepo;
    private readonly jugadoresRepository;
    private readonly configService;
    private readonly logger;
    private readonly threshold;
    constructor(regionRepo: Repository<Region>, associationRepo: Repository<Asociacion>, clubRepo: Repository<Club>, jugadoresRepository: Repository<Jugador>, configService: ConfigService);
    createPlayer(createJugadorDto: CreateJugadorDto, file?: Express.Multer.File): Promise<Jugador>;
    updatePlay(id: number, updateJugadorDto: Partial<UpdateJugadorDto>, file?: Express.Multer.File): Promise<Jugador>;
    findAll(paginationDto: PaginationDto, user?: {
        role: string;
        regionId?: number;
    }): Promise<{
        players: Jugador[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<Jugador>;
    buscarPorRut(rut: string): Promise<Jugador | null>;
    obtenerDuplicados(paginationDto: PaginationDto): Promise<{
        jugadores: Jugador[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
    deletePlay(id: number): Promise<Jugador>;
    deleteMany(ids: number[]): Promise<{
        affected: number;
    }>;
    volverPlay(id: number): Promise<Jugador>;
    markDuplicates(): Promise<{
        message: string;
        duplicates: string[];
    }>;
    importFromExcel(filePath: string): Promise<{
        message: string;
        totalFilas: number;
        creados: number;
        duplicados: number;
    }>;
    private limpiarYFormatearRut;
    private normalizarFormatoRut;
    private convertirFechaExcel;
    private cleanField;
    private parseExcelDate;
    marcarComoDuplicadosMasivo(ids?: number[]): Promise<{
        message: string;
        registrosAfectados: number;
    }>;
    restaurarMasivo(ids?: number[]): Promise<{
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
