import { Asociacion } from "src/asociacion/asociacion/entities/asociacion.entity";
import { Jugador } from "src/jugador/jugador/entities/jugador.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Club {
    @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Asociacion, (Asociacion) => Asociacion.clubs)
  asociacion: Asociacion;

  @OneToMany(() => Jugador, (player) => player.club)
  jugadores: Jugador[];
}
