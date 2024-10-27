import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from "@nestjs/common";
import { jwtConstants } from "./constant/jwt.constants";

import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";
import { RegisterDto } from "./dto/register.dto"; // Importa el nuevo DTO
import { MailService } from "src/mail/mail.service"; // Asegúrate de importar MailService
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";

import * as bcryptjs from "bcryptjs";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthEntity } from "./entity/auth.entity";
import { UserRoles } from "src/user/enums/user-roles.enums"; // Asegúrate de importar UserRoles


import { Repository } from "typeorm";
import { AuthResponse } from "./entity/authresponse.entity";

@Injectable()
export class AuthService{

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
        private readonly mailService: MailService, // Inyecta MailService aquí
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
    // Método para registrar un nuevo usuario
    async register(registerDto: RegisterDto): Promise<AuthResponse> {
        const { email, password, firstName, lastName, rut } = registerDto;
    
        // Verifica si el correo ya está en uso
        const existingUser = await this.userService.findOneByEmail(email);
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está en uso');
        }
    
        // Hash de la contraseña para mayor seguridad
        const hashedPassword = await bcryptjs.hash(password, 10);
    
        // Crea el nuevo usuario en la base de datos
        const newUser = await this.userService.addNewUser({
            firstName,
            lastName,
            rut, // Incluye el rut aquí
            email,
            password: hashedPassword, // Almacena la contraseña hasheada
            role: UserRoles.Student, // Asigna un rol predeterminado
        });
    
        // Genera un token JWT para el usuario
        const payload = { email: newUser.email, id: newUser.id };
        const token = await this.jwtService.signAsync(payload);
    
        // Devuelve la respuesta con el token, mensaje, email e id
        return {
            message: 'Registro exitoso',
            token,
            verificacion: true, // Establece el estado de verificación como true
            email: newUser.email, // Incluye el correo electrónico
            id: newUser.id, // Incluye el ID del usuario
        } as AuthResponse;
    }
    
    //olvido contraseña

    // auth.service.ts
    async forgotPassword(forgotPassDto: ForgotPassDto): Promise<string> {
        const { email } = forgotPassDto;

        // Busca al usuario por su correo electrónico
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('No se encontró un usuario con ese correo');
        }

        // Genera un token para la recuperación de contraseña
        const token = await this.jwtService.signAsync({ id: user.id });

        // Envía el correo de recuperación, pasando el email del usuario al MailService
        await this.mailService.sendPasswordReset(user.email, token);

        return 'Se ha enviado un enlace de recuperación de contraseña a tu correo';
    }

async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    const { token, newPassword } = resetPasswordDto;

    // Verifica el token y recupera la información del usuario
    const payload = this.jwtService.verify(token); // Verifica el token

    const user = await this.userService.findUserById(payload.id);
    if (!user) {
        throw new NotFoundException('Usuario no encontrado');
    }

    // Hashea la nueva contraseña
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Actualiza la contraseña en la base de datos
    await this.authRepository.update({ idUser: user.id }, { password: hashedPassword });

    return 'Contraseña actualizada exitosamente';
}
    //conseguirInformacionUsaurio
    //conseguirRol
    //actualizarInformacion
    //findByNames
}