import { Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from "./constant/jwt.constants";

import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";
import { LoginDto } from "./dto/login.dto";

import * as bcryptjs from "bcryptjs";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthEntity } from "./entity/auth.entity";

import { Repository } from "typeorm";
import { AuthResponse } from "./entity/authresponse.entity";

@Injectable()
export class AuthService{

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(AuthEntity)
        private readonly authRepository : Repository<AuthEntity>,
    ) {}

    async login({ email, password }: LoginDto){
        const user = await this.userService.findOneByEmail(email);

        if(!user){
            throw new UnauthorizedException("Email no valido");
        }

        const auth = await this.authRepository.findOne({where: {idUser: user.id}});
        if (!auth) {
            throw new UnauthorizedException("Usuario sin credenciales de autenticación");
        }

        const isPasswordValid = await bcryptjs.compare(password, auth.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Contraseña o email no válido");
        }

        const payload = { email: user.email, id: user.id, name: user.firstName, lastName: user.lastName};
        const token = await this.jwtService.signAsync(payload);

        return {
            message: "Inicio de sesion exitoso",
            token
        } as AuthResponse
    }

    //Agregar service de register
    //conseguirInformacionUsaurio
    //conseguirRol
    //actualizarInformacion
    //findByNames
}