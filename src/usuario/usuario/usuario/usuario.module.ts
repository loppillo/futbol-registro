import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/usuario.entity";
import { UsersService } from "./usuario.service";
import { UsersController } from "./usuario.controller";


@Module({
  imports: [
    
   TypeOrmModule.forFeature([User]),
    

  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsuarioModule {}
