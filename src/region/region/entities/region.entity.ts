import { Asociacion } from "src/asociacion/asociacion/entities/asociacion.entity";
import { User } from "src/usuario/usuario/usuario/entities/usuario.entity";

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Region {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Asociacion, (association) => association.region)
asociaciones:Asociacion[];

@OneToMany(() => User, (usuario) => usuario.region)
users:User[];
}
