import { EntityRepository, Repository } from 'typeorm';
import { User } from './entities/usuario.entity';


@EntityRepository(User)
export class UserRepository extends Repository<User> {
  // Puedes agregar métodos personalizados aquí si es necesario

  // Ejemplo: encontrar usuarios por su nombre
  async findByNombre(nombre: string): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where('user.nombre = :nombre', { nombre })
      .getMany();
  }
}