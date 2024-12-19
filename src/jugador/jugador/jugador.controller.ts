import { Controller, Get, Post, Body, Param, Delete, Put, BadRequestException, UploadedFile, UseInterceptors, NotFoundException, Query, Res, UseGuards, Req, createParamDecorator, ExecutionContext, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JugadoresService } from './jugador.service';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { UpdateJugadorDto } from './dto/update-jugador.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { diskStorage } from 'multer';
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

import { Request } from 'express';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtStrategy } from 'src/auth/jwt.strategy';





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
  id:number;
  paterno:string;
  materno:string;
  nombre: string;
  rut: string;
  fecha_nacimiento?: number | string;
  club_deportivo:string;
  asociacion: string;
  fecha_inscripcion?: number | string; // Fecha en número o string
  foto:string;
}




@Controller('jugadores')
export class JugadoresController {
  constructor(private readonly jugadoresService: JugadoresService,@InjectRepository(Jugador)
  private jugadoresRepository: Repository<Jugador>,) {}

  @Post()
  @UseInterceptors(FileInterceptor('foto', {
    storage: diskStorage({
      destination: './uploads/players', // Carpeta donde se guardarán las fotos
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = extname(file.originalname);
        const filename = `${uniqueSuffix}${extension}`;
        cb(null, filename);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png).'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @Body() createJugadorDto: CreateJugadorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const filePath = `uploads/players${file.filename}`; // Ruta relativa de la foto
    createJugadorDto.foto = filePath; // Asignar la ruta de la foto al DTO
    return this.jugadoresService.create(createJugadorDto);
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



  @Post('create')
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
      imagePath         // Ruta de la imagen
    );

    // Confirmar la creación del jugador
    return {
      message: 'Jugador creado con éxito',
      player,
      imageUrl: imagePath
    };
  }





@UseGuards(AuthGuard)
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
  @UseInterceptors(FileInterceptor('foto', { dest: './uploads/players' }))
  async updateJugador(
    @Param('id') id: number,
    @Body() updateJugadorDto: UpdateJugadorDto,
    @UploadedFile() foto: Express.Multer.File,
  ) {
    const fotoPath = foto ? `./uploads/players/${foto.filename}` : undefined; // Ruta de la foto o undefined
    console.log('Foto recibida en controlador:', fotoPath);
    return this.jugadoresService.updatePlay(id, updateJugadorDto, fotoPath);
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
  
        fecha_inscripcion:jugador.fecha_inscripcion || '2024-08-20'
      };
    });

 // Guardar jugadores con fechas convertidas
 const resultado = await this.jugadoresService.importarJugadores(jugadoresConFechaConvertida);

 return resultado;
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
  getPhotoByJugadorId(@Param('id') id: number, @Res() res: Response) {
    const directoryPath = join(process.cwd(), './uploads/players');
    console.log('Directory Path:', directoryPath);
    console.log('Player ID:', id);
    
    // Verificar si el directorio existe
    if (!fs.existsSync(directoryPath)) {
      console.error('El directorio no existe:', directoryPath);
      return res.status(404).json({ message: 'Directorio no existe' });
    }
  
    // Obtener todos los archivos de la carpeta
    const files = fs.readdirSync(directoryPath);

  
    // Buscar un archivo que contenga el ID en su nombre
    const playerImage = files.find((file) => /player-\d+-\d+/.test(file)); // Busca el ID en cualquier parte del nombre del archivo

  
    if (playerImage) {
      console.log('Imagen del jugador encontrada:', playerImage);
      const filePath = join(directoryPath, playerImage);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          res.status(404).json({ message: 'No se pudo enviar la imagen' });
        }
      });
    } else {
      console.error('Imagen no encontrada para el jugador con ID:', id);
      return res.status(404).json({ message: 'Imagen no encontrada para el jugador' });
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


  
  




