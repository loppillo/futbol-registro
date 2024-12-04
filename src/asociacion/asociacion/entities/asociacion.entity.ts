import { Club } from "src/club/club/entities/club.entity";
import { Region } from "src/region/region/entities/region.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Asociacion {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    name: string;
  
    @ManyToOne(() => Region, (region) => region.asociaciones)
    region: Region;
  
    @OneToMany(() => Club, (club) => club.asociacion)
    clubs: Club[];

}
