import { Region } from "src/region/region/entities/region.entity";

import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, DeleteDateColumn, ManyToOne } from "typeorm";

@Entity()
export class User {
  @Column({ primary: true, generated: true })
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column()
  role: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Region, (region) => region.users, { eager: true })
  region: Region; // Relación con la entidad Región


  @Column({ nullable: true }) // Este campo guarda el ID directamente
  regio: string;
}