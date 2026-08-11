import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { Response, Request } from 'express';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import sharp = require('sharp');
import createTesseractWorker, { recognize } from 'tesseract.js';

import { JugadoresService } from './jugador.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { PaginationDto } from './dto/PaginationDto.dto';
import { Jugador } from './entities/jugador.entity';
import { IsArray, IsOptional } from 'class-validator';

export class ActualizacionMasivaDto {
  @IsArray()
  @IsOptional()
  ids?: number[];
}

// Configuración reutilizable para almacenamiento de fotos de jugadores
const playerStorage = diskStorage({
  destination: './uploads/players',
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `player-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Solo se permiten formatos .png, .jpg y .jpeg'),
      false,
    );
  }
  callback(null, true);
};

@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly jugadoresService: JugadoresService) {}

  // ==========================================
  // CREACIÓN Y EDICIÓN
  // ==========================================

  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: playerStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async createPlayer(
    @UploadedFile() file: Express.Multer.File,
    @Body() playerData: CreateJugadorDto,
  ) {
    const player = await this.jugadoresService.createPlayer(playerData, file);
    return {
      message: 'Jugador creado con éxito',
      player,
    };
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: playerStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async updatePlayer(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateJugadorDto: Partial<UpdateJugadorDto>,
  ) {
    const updatedPlayer = await this.jugadoresService.updatePlay(
      id,
      updateJugadorDto,
      file,
    );

    return {
      message: 'Jugador actualizado con éxito',
      player: updatedPlayer,
    };
  }

  // ==========================================
  // CONSULTAS Y BÚSQUEDAS
  // ==========================================

  @Get('obtener')
  @UseGuards(AuthGuard('jwt'))
  async getPlayers(@Query() paginationDto: PaginationDto, @Req() req: any) {
    const user = req.user;
    return this.jugadoresService.findAll(paginationDto, user);
  }

  @Get('l')
  async getJugadoresPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.jugadoresService.findAll(
      { page, limit } as PaginationDto,
      undefined,
    );
  }

  @Get('duplicados')
  async obtenerDuplicados(@Query() paginationDto: PaginationDto) {
    return this.jugadoresService.obtenerDuplicados(paginationDto);
  }

  @Get('duplicados/all')
  async obtenerDuplicadosExcel() {
    return this.jugadoresService.obtenerDuplicados({
      page: 1,
      limit: 10000,
    });
  }

  @Get('buscar/:rut')
  async buscarPorRut(@Param('rut') rut: string) {
    const jugador = await this.jugadoresService.buscarPorRut(rut);
    if (!jugador) {
      throw new NotFoundException('Jugador no encontrado');
    }
    return jugador;
  }

  @Get('buscarEquipo/:club_deportivo')
  @UseGuards(AuthGuard('jwt'))
  async buscarPorClub(
    @Param('club_deportivo') clubDeportivo: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const regionName = user?.region?.name || user?.regionName || '';

    return this.jugadoresService.findAll({
      clubName: clubDeportivo,
      regionName,
      page: 1,
      limit: 1000,
    });
  }

  @Get(':id')
  async getJugadorPorId(@Param('id', ParseIntPipe) id: number) {
    return await this.jugadoresService.findOne(id);
  }

  // ==========================================
  // SOFT-DELETE Y RESTAURACIÓN
  // ==========================================

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.deletePlay(id);
  }

  @Delete('volver/:id')
  volver(@Param('id', ParseIntPipe) id: number) {
    return this.jugadoresService.volverPlay(id);
  }

  @Post('eliminar-masivo')
  async eliminarMasivo(@Body('ids') ids: number[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un ID para eliminar.',
      );
    }
    return await this.jugadoresService.deleteMany(ids);
  }

  // ==========================================
  // IMPORTACIÓN EXCEL
  // ==========================================

  @Post('excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/jugadores',
        filename: (_req, file, callback) => {
          callback(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo Excel.');
    }
    return await this.jugadoresService.importFromExcel(file.path);
  }

  // ==========================================
  // VALIDACIÓN OCR DE CARNET / RUT
  // ==========================================

  @Post('validar-rut-imagen')
@UseInterceptors(FileInterceptor('foto', { storage: memoryStorage() }))
async validarRutImagen(@UploadedFile() foto: Express.Multer.File) {
  if (!foto) {
    throw new BadRequestException('Debe subir una imagen del carnet.');
  }

  try {
    // 1. Procesamiento de imagen con Sharp
    const imagenProcesada = await sharp(foto.buffer)
      .resize({ width: 1400, withoutEnlargement: true })
      .grayscale()
      .linear(1.3, -15)
      .sharpen()
      .toFormat('jpeg', { quality: 90 })
      .toBuffer();

    // 2. Reconocimiento OCR directamente sobre el Buffer (sin Data URI)
    const { data } = await recognize(imagenProcesada, 'spa');

    // 3. Extraer y validar RUTs del texto obtenido
    const rutsValidos = this.extraerYValidarRuts(data.text);

    for (const rutFormateado of rutsValidos) {
      const jugador = await this.jugadoresService.buscarPorRut(rutFormateado);

      if (!jugador) {
        return {
          mensaje: 'RUT válido y no registrado',
          rut: rutFormateado,
        };
      } else {
        return {
          mensaje: 'RUT válido y registrado',
          rut: rutFormateado,
          nombreCompleto: `${jugador.nombre || ''} ${
            jugador.paterno || ''
          } ${jugador.materno || ''}`.trim(),
          nombre: jugador.nombre,
          paterno: jugador.paterno,
          sancionado: jugador.sancionado,
          recalificado: jugador.recalificado,
          materno: jugador.materno,
          club: jugador.club?.name || 'Sin Club',
          asociacion: jugador.club?.asociacion?.name || 'Sin Asociación',
          region: jugador.club?.asociacion?.region?.name || 'Sin Región',
        };
      }
    }

    return {
      mensaje: 'No se encontró un RUT válido en la imagen',
      posiblesRuts: rutsValidos,
    };

  } catch (error) {
    // 🟢 Imprime el error exacto en la consola de NestJS para depurar
    console.log('Error detallado en validarRutImagen:', error);
    
    throw new InternalServerErrorException(
      `Error al procesar la imagen del carnet: ${error || error}`,
    );
  }

}

  @Get('photo/:id')
  async getPhotoByJugadorId(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const directoryPath = join(process.cwd(), 'uploads/players');

      if (!fs.existsSync(directoryPath)) {
        return res.status(404).json({ message: 'Directorio no existe' });
      }

      const files = fs.readdirSync(directoryPath);
      const playerImage = files.find((file) => file.includes(`player-${id}-`));

      if (playerImage) {
        return res.sendFile(join(directoryPath, playerImage));
      } else {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  }

  // ==========================================
  // HELPERS DE RUT Y MÓDULO 11
  // ==========================================

  private extraerYValidarRuts(texto: string): string[] {
    const rutsEncontrados = new Set<string>();

    const textoLimpio = texto
      .toUpperCase()
      .replace(/[\’\'\`\´\“\”\/\$\%\*\:\;\<\>]/g, ' ')
      .replace(/\s+/g, ' ');

    const regexRut = /(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3}|\d{7,8})[-_\s]?([\dK])/g;
    const coincidencias = [...textoLimpio.matchAll(regexRut)];

    for (const match of coincidencias) {
      const cuerpo = match[1].replace(/[^\d]/g, '');
      const dvLeido = match[2].toUpperCase();

      if (cuerpo.length >= 7 && cuerpo.length <= 8) {
        if (this.validarRutModulo11(cuerpo, dvLeido)) {
          rutsEncontrados.add(
            this.formatearRutConPuntos(`${cuerpo}-${dvLeido}`),
          );
        } else {
          const dvCalculado = this.obtenerDvModulo11(cuerpo);
          rutsEncontrados.add(
            this.formatearRutConPuntos(`${cuerpo}-${dvCalculado}`),
          );
        }
      }
    }

    return Array.from(rutsEncontrados);
  }

  private obtenerDvModulo11(cuerpo: string): string {
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    if (resto === 11) return '0';
    if (resto === 10) return 'K';
    return resto.toString();
  }

  private validarRutModulo11(cuerpo: string, dvIngresado: string): boolean {
    return this.obtenerDvModulo11(cuerpo) === dvIngresado.toUpperCase();
  }

  private formatearRutConPuntos(rut: string): string {
    const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2) return rut;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${conPuntos}-${dv}`;
  }

  @Patch('marcar-duplicados-masivo')
async marcarComoDuplicadosMasivo(@Body() dto: ActualizacionMasivaDto) {
  return await this.jugadoresService.marcarComoDuplicadosMasivo(dto.ids);
}

@Patch('restaurar-masivo')
async restaurarMasivo(@Body() dto: ActualizacionMasivaDto) {
  return await this.jugadoresService.restaurarMasivo(dto.ids);
}

@Get('duplicados/region/:regionId')
  async obtenerDuplicadosPorRegion(
    @Param('regionId') regionId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.jugadoresService.obtenerDuplicadosPorRegion(regionId, paginationDto);
  }
}