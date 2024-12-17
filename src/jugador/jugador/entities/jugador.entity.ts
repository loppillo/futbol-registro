import { Asociacion } from 'src/asociacion/asociacion/entities/asociacion.entity';
import { Club } from 'src/club/club/entities/club.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('jugadores')
export class Jugador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  paterno: string;

  @Column()
  materno: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  rut: string;

  @Column({ type: 'date' })
  fecha_nacimiento: Date;


  @Column({ type: 'date' })
  fecha_inscripcion:Date;   

  @Column({ nullable: true })
  foto: string;

    // Campo para marcar duplicados
  @Column({ default: false })
  sancionado: boolean;

  @Column({ default: false })
  recalificado: boolean;

  // Campo para marcar duplicados
  @Column({ default: false })
  duplicado: boolean;

  @ManyToOne(() => Club, (club) => club.jugadores)
  club: Club;

  @Column({ nullable: true }) // ⚠️ ¡Agrega clubId explícitamente!
  clubId: number;
}