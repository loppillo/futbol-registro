import { Controller, Get, Post, Body, Param, Delete, Put, BadRequestException, UploadedFile, UseInterceptors, NotFoundException, Query, Res, UseGuards, Req, createParamDecorator, ExecutionContext, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JugadoresService } from './jugador.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { diskStorage, memoryStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PaginationDto } from './dto/PaginationDto.dto';
import { JugadorResponseDto } from './dto/JugadorResponseDto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Jugador } from './entities/jugador.entity';
import { Repository } from 'typeorm';
import * as sharp from 'sharp';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtStrategy } from 'src/auth/jwt.strategy';
const Tesseract = require('tesseract.js');






const storage = diskStorage({
  destination: './uploads/jugadores', // Directory to save uploaded files
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4() + extname(file.originalname); // Use a unique identifier
    cb(null, uniqueSuffix); // Set the filename
  }
});
interface RequestWithUser extends Request {
  user: { email: string; role: string };
}

export const Users = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Esto asume que `req.user` fue configurado por un Guard como `AuthGuard`
  },
);

interface ClubData {
  club: string;
  association?: string;
  region?: string;
}


interface Jugado {
  id: number;
  paterno: string;
  materno: string;
  nombre: string;
  rut: string;
  fecha_nacimiento?: number | string;
  club_deportivo: string;
  asociacion: string;
  fecha_inscripcion?: number | string; // Fecha en número o string
  foto: string;
}




@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly jugadoresService: JugadoresService, @InjectRepository(Jugador)
  private jugadoresRepository: Repository<Jugador>,) { }

  @Post('create')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/players',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `player-${uniqueSuffix}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only .png, .jpg and .jpeg formats are allowed'), false);
        }
        callback(null, true);
      },
    })
  )
  async Player(
    @UploadedFile() file: Express.Multer.File,
    @Body() playerData: CreateJugadorDto
  ) {
    if (!file) throw new BadRequestException('Se requiere una imagen');
    const imagePath = `/players/${file.filename}`;
    playerData.foto = imagePath;
    const player = await this.jugadoresService.create(playerData);
    return { message: 'Jugador creado con éxito', player };
  }


  @Get('duplicados')
  async obtenerDuplicados(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const pageNumber = isNaN(Number(page)) ? 1 : Number(page);
    const limitNumber = isNaN(Number(limit)) ? 10 : Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    return this.jugadoresService.obtenerDuplicados(page, limit);
  }

  @Get('duplicados/all')
  async obtenerDuplicadosExcel(): Promise<any[]> {
    return this.jugadoresService.obtenerDuplicadosSinPaginacion();
  }


  @Post('creates')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/players', // Carpeta donde se almacenarán las imágenes
        filename: (req, file, callback) => {
          // Generar un nombre de archivo único (timestamp + extensión)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `player-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only .png, .jpg and .jpeg formats are allowed'), false);
        }
        callback(null, true);
      },
    })
  )
  async createPlayer(
    @UploadedFile() file: Express.Multer.File,
    @Body() playerData: CreateJugadorDto
  ) {
    // Validar si el archivo fue cargado correctamente
    if (!file) {
      throw new BadRequestException('Se requiere una imagen para crear el jugador.');
    }

    // Obtener la ruta de la imagen
    const imagePath = `https://fenfurnacional.com/uploads/players/${file.filename}`;

    // Crear el jugador con los datos proporcionados
    const player = await this.jugadoresService.createPlayer(
      { ...playerData }, // DTO con los datos del jugador
      // Ruta de la imagen
    );

    // Confirmar la creación del jugador
    return {
      message: 'Jugador creado con éxito',
      player,
      imageUrl: imagePath
    };
  }






  @Get('obtener')
  async getPlayers(@Query() paginationDto: PaginationDto): Promise<{ players: JugadorResponseDto[]; total: number }> {
    return this.jugadoresService.findAll(paginationDto);
  }


  @Post('excel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/jugadores', // Custom folder for uploads
        filename: (req, file, callback) => {
          const filename = `${Date.now()}-${file.originalname}`;
          callback(null, filename); // Set the filename
        },
      }),
    }),
  )
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    const imagePath = file.path; // Get the correct path from the uploaded file
    return await this.jugadoresService.importFromExcel(imagePath);
  }

  // jugadores.controller.ts
  @Get('l')
  async getJugadores(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.jugadoresService.findAllPaginated(page, limit);
  }

  @Get(':id')
  async getJugadorPorId(@Param('id') id: number): Promise<Jugador> {
    return await this.jugadoresService.obtenerJugadorPorId(id);
  }




  @Put(':id')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/players',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `player-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(new BadRequestException('Solo se permiten archivos .png, .jpg y .jpeg'), false);
        }
        callback(null, true);
      },
    })
  )
  async upPlayer(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateJugadorDto: Partial<UpdateJugadorDto>
  ) {
    // Verificar si hay un archivo
    let imageUrl = updateJugadorDto.foto; // Usar la URL existente por defecto
    if (file) {
      const filePath = `uploads/players/${file.filename}`;
      imageUrl = `https://fenfurnacional.com/uploads/players/${file.filename}`;
      updateJugadorDto.foto = filePath;
      console.log(updateJugadorDto.foto) // Guarda la ruta de la imagen en la base de datos
    }



    // Llama al servicio para actualizar el jugador
    const updatedPlayer = await this.jugadoresService.updatePlay(
      id,
      updateJugadorDto
    );

    // Retorna la respuesta con la URL pública
    return {
      message: 'Jugador actualizado con éxito',
      player: {
        ...updatedPlayer,
        foto: imageUrl // Devolver la URL pública
      },
    };
  }


  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.jugadoresService.deletePlay(+id);
  }

  @Delete('/volver/:id')
  volver(@Param('id') id: number) {
    return this.jugadoresService.volverPlay(+id);
  }


  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
      },
    }),
  }))
  async importarJugadores(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jugadores: Jugador[] = XLSX.utils.sheet_to_json(worksheet);

    // Convertir fechas numéricas a formato legible


    const jugadoresConFechaConvertida = jugadores.map((jugador) => {





      return {
        rut: jugador.rut || 'No dato',
        nombre: jugador.nombre || 'No dato',
        materno: jugador.materno || 'No dato',
        paterno: jugador.paterno || 'No dato',

        fecha_nacimiento: jugador.fecha_nacimiento || 'No dato',

        fecha_inscripcion: jugador.fecha_inscripcion || '2024-08-20'
      };
    });

    // Guardar jugadores con fechas convertidas
    const resultado = await this.jugadoresService.importarJugadores(jugadoresConFechaConvertida);

    return resultado;
  }




  @Post('validar-rut-imagen')
@UseInterceptors(FileInterceptor('foto', { storage: memoryStorage() }))
async validarRutImagen(@UploadedFile() foto: Express.Multer.File) {
  if (!foto) {
    throw new BadRequestException('Debe subir una imagen');
  }

  // Procesamiento con sharp: escala, gris, mejora contraste
  const imagenProcesada = await sharp(foto.buffer)
    .resize({ width: 400, withoutEnlargement: true }) // escala max 400px ancho
    .grayscale()
    .normalize() // mejora contraste y brillo
    .toBuffer();

  // Convertir imagen procesada a base64 para Tesseract
  const imageBase64 = `data:image/jpeg;base64,${imagenProcesada.toString('base64')}`;

  // OCR con Tesseract
  const { data } = await Tesseract.recognize(imageBase64, 'spa');

  // Extraer posibles RUTs
  const posiblesRuts = this.extraerRuts(data.text);
  for (const posibleRut of posiblesRuts) {
  const rutFormateado = this.formatearRutConPuntos(posibleRut);
  if (rutFormateado) {
    const usuarioExistente = await this.jugadoresRepository.findOne({ where: { rut: rutFormateado } });
    if (!usuarioExistente) {
      return { mensaje: 'RUT válido y no registrado', rut: rutFormateado };
    } else {
      return { mensaje: 'RUT válido y registrado', rut: rutFormateado };
    }
  }
}
  console.log('Posibles RUTs extraídos:', posiblesRuts);



  // Validar cada RUT extraído



  return { mensaje: 'No se encontró un RUT válido en la imagen',posiblesRuts: posiblesRuts.map(r => this.formatearRut(r)) };
}

private extraerRuts(texto: string): string[] {
  console.log('Texto extraído por OCR:', texto);

  const rutsSet = new Set<string>();

  // 1. Extraer RUNs desordenados con espacios y caracteres extra
  const runExtraido = this.extraerRunDelTexto(texto);
  if (runExtraido) {
    rutsSet.add(this.normalizarRut(runExtraido));
  }

  // 2. Detectar con formato clásico 12.345.678-K
  const formatoClasico = /\b\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]\b/g;
  const matchesClasico = texto.match(formatoClasico);
  if (matchesClasico) {
    matchesClasico.forEach(rut => rutsSet.add(this.normalizarRut(rut)));
  }

  // 3. Detectar sin puntos: 12345678-K
  const formatoSimple = /\b\d{7,8}-[0-9Kk]\b/g;
  const matchesSimple = texto.match(formatoSimple);
  if (matchesSimple) {
    matchesSimple.forEach(rut => rutsSet.add(this.normalizarRut(rut)));
  }

  // 4. Detectar números como 12345678K (sin guion)
  const formatoSinGuion = /\b\d{7,8}[0-9Kk]\b/g;
  const matchesSinGuion = texto.match(formatoSinGuion);
  if (matchesSinGuion) {
    matchesSinGuion.forEach(r => {
      const cuerpo = r.slice(0, -1);
      const dv = r.slice(-1).toUpperCase();
      rutsSet.add(this.normalizarRut(`${cuerpo}-${dv}`));
    });
  }

  return Array.from(rutsSet);
}

// Extrae RUN con posibles espacios y signos sueltos
 extraerRunDelTexto(texto: string): string | null {
  const regex = /(\d{1,2}[\.\s]?\d{3}[\.\s]?\d{3})[\s\-]?(\d|[Kk])/g;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    let [ , parteNumerica, dv ] = match;
    const cuerpo = parteNumerica.replace(/[\.\s]/g, '');
    dv = dv.toUpperCase();
    return `${cuerpo}-${dv}`;
  }
  return null;
}

// Normaliza el RUT: elimina puntos, pone guion y dv en mayúscula
private normalizarRut(rut: string): string {
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  return `${cuerpo}-${dv}`;
}




private validarRutChileno(rut: string): string | false {
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i)) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  if (dv === dvCalculado) {
    // Si es válido, devuelve el RUT formateado
    return this.formatearRut(cuerpo);
  } else {
    return false;
  }
}

private formatearRut(rutNormalizado: string): string {
  if (!rutNormalizado.includes('-')) {
    console.warn('RUT malformado recibido en formatearRut:', rutNormalizado);
    return rutNormalizado; // O lanza error si prefieres
  }

  const [cuerpo, dv] = rutNormalizado.split('-');

  if (!cuerpo || !dv) {
    console.warn('Cuerpo o dígito verificador inválido:', rutNormalizado);
    return rutNormalizado;
  }

  let cuerpoFormateado = '';
  let contador = 0;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
    contador++;
    if (contador % 3 === 0 && i !== 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
    }
  }

  return `${cuerpoFormateado}-${dv.toUpperCase()}`;
}


private formatearRutConPuntos(rut: string): string {
  // Elimina puntos y guion si existen
  rut = rut.replace(/\./g, '').replace(/-/g, '');

  if (rut.length < 2) {
    console.warn('RUT demasiado corto:', rut);
    return rut; // Devuelve el original si es inválido
  }

  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();

  // Agrega los puntos desde el final hacia el inicio
  let cuerpoFormateado = '';
  let contador = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
    contador++;
    if (contador % 3 === 0 && i !== 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
    }
  }

  return `${cuerpoFormateado}-${dv}`;
}

  @Get('buscar/:rut')
  async buscarPorRut(@Param('rut') rut: string) {
    const jugador = await this.jugadoresService.buscarPorRut(rut);
    if (!jugador) {
      throw new NotFoundException('Jugador no encontrado');
    }
    return jugador;
  }

  // jugadores.controller.ts
  @UseGuards(JwtStrategy)
  @UseGuards(AuthGuard)
  @Get('buscarEquipo/:club_deportivo')
  async buscarPorClub(@Param('club_deportivo') club_deportivo: string, @Req() req) {
    const user = req.user;  // Aquí obtenemos al usuario de la solicitud


    // Verificar el rol y la región
    if (user.role === 'dirigente' && !user.region) {


      throw new UnauthorizedException('Access denied: Region is required for dirigente');
    }


    // Realizar la búsqueda de jugadores con el club y la región
    const jugadores = await this.jugadoresService.buscarPorClub(club_deportivo, user.region);
    if (jugadores.length === 0) {
      throw new NotFoundException('No se encontraron jugadores para el club deportivo especificado');
    }

    return jugadores;
  }



  private convertirFechaExcel(fechaExcel: number): string {
    if (!fechaExcel || isNaN(fechaExcel)) {
      return '2023-08-20'; // Valor predeterminado si la fecha es inválida
    }

    const fechaBase = new Date(1900, 0, fechaExcel - 1); // 1 de enero de 1900
    fechaBase.setDate(fechaBase.getDate() + 1); // Ajuste para Excel
    return fechaBase.toISOString().split('T')[0]; // Retorna en formato 'YYYY-MM-DD'
  }



  @Post('upload/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/jugadores', // Directorio donde se guardarán las imágenes
        filename: (req, file, cb) => {
          const filename = `${req.params.id}-${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Param('id') id: string) {
    // La imagen ya se guardó en la carpeta especificada
    return { message: 'Imagen subida exitosamente', filename: file.filename };
  }



  @Get('photo/:id')
  async getPhotoByJugadorId(@Param('id') id: string, @Res() res: Response) {
    try {
      const directoryPath = join(process.cwd(), 'uploads/players');
      console.log('Path de la carpeta:', directoryPath);
      console.log('ID del jugador:', id);

      // Verificar si el directorio existe
      if (!fs.existsSync(directoryPath)) {
        console.error('El directorio no existe:', directoryPath);
        return res.status(404).json({ message: 'Directorio no existe' });
      }

      // Obtener todos los archivos de la carpeta
      const files = fs.readdirSync(directoryPath);
      console.log('Archivos en la carpeta:', files);

      // Buscar el archivo con el ID del jugador
      const playerImage = files.find(file => file.includes(`player-${id}-`));

      if (playerImage) {
        console.log('Imagen encontrada:', playerImage);
        const filePath = join(directoryPath, playerImage);
        return res.sendFile(filePath);
      } else {
        console.error('Imagen no encontrada para el jugador con ID:', id);
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }
    } catch (error) {
      console.error('Error general:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  }





  @Put('update/:id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/jugadores',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname);
          callback(null, `${req.params.id}-${uniqueSuffix}${extension}`);
        },
      }),
    })
  )
  async updatePlayer(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updatePlayerDto: UpdateJugadorDto
  ) {
    let imagePath: string | undefined;

    if (file) {
      imagePath = `uploads/jugadores/${file.filename}`; // Ruta de la imagen nueva
    }

    const updatedPlayer = await this.jugadoresService.updatePlay(id, updatePlayerDto);

    return {
      message: 'Jugador updated successfully',
      player: {
        ...updatedPlayer,
        imagePath: imagePath || updatedPlayer.foto, // Se envía la nueva ruta de imagen o la existente
      },
    };
  }

  @Post('uploads')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.originalname.endsWith('.xlsx')) {
      return { message: 'Por favor, sube un archivo Excel válido.' };
    }

    // Procesa el archivo Excel
    const { mainData, referenceData } = this.jugadoresService.processExcel(file.buffer);

    // Rellena los datos faltantes
    const filledData = this.jugadoresService.fillMissingData(mainData, referenceData);

    return filledData;
  }

  @Post(':id/uploadPhoto')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Directorio donde se guardarán los archivos
        filename: (req, file, callback) => {
          const filename = `${Date.now()}${path.extname(file.originalname)}`; // Nombre del archivo
          callback(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // Limite de tamaño para el archivo (5MB)
    }),
  )
  async uploadPhoto(@Param('id') id: number, @UploadedFile() file: Express.Multer.File) {
    // Retornamos la ruta donde se guarda el archivo
    const filePath = `uploads/${file.filename}`;
    // Aquí puedes actualizar el jugador con la ruta de la foto en la base de datos si lo necesitas
    await this.jugadoresService.updateJugadorPhoto(id, filePath);
    return { filePath }; // Esto es lo que regresamos al frontend
  }



}








