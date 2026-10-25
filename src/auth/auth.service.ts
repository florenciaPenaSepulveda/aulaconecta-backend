import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as jwt from 'jsonwebtoken';
import { jwtConstants } from "./constant/jwt.constants";
import { AuthEntity } from "./entity/auth.entity";
import { UserService } from "src/user/user.service";
import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { RegisterDto } from "./dto/register.dto";
import * as bcryptjs from "bcryptjs";
import { randomBytes } from 'crypto';
import { AuthResponse } from "./entity/authresponse.entity";
import { UserRoles } from "src/user/enums/user-roles.enums";
import { ChangePasswordDto } from "./dto/change-password";
import { isMailConfigured, resetTemplate, sendMail } from "src/mail/mail";

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    async login({ email, password }: LoginDto) {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException("Email no válido");
        }
        const auth = await this.authRepository.findOne({ where: { idUser: user.id } });
        if (!auth) {
            throw new UnauthorizedException("Usuario sin credenciales de autenticación");
        }
        const isPasswordValid = await bcryptjs.compare(password, auth.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Contraseña o email no válido");
        }
        const token = await this.jwtService.signAsync({ id: user.id });

        return {
            message: "Inicio de sesión exitoso",
            token,
            role: user.role,
            firstName: user.firstName,
            id: user.id,
            isChangePassword: auth.isChangePass
        } as AuthResponse;
    }

    async register({ password, email, firstName, lastName, role, rut }: RegisterDto) {
        if (role !== UserRoles.Teacher && role !== UserRoles.Parents) {
            throw new BadRequestException('Solo profesores y padres pueden registrarse a través de esta función.');
        }
        const user = await this.userService.findOneByEmail(email);
        if (user) {
            throw new BadRequestException("El email ya se encuentra registrado");
        }
        await this.userService.addNewUser({
            firstName,
            lastName,
            rut,
            email,
            password,
            role
        });
        return {
            message: "Usuario creado con éxito",
        } as AuthResponse;
    }

    async forgotpass({ email }: ForgotPassDto) {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException("Email no válido");
        }
        const auth = await this.findByIdAuth(user.id);
        if (!auth) {
            throw new BadRequestException("El usuario no tiene credenciales de acceso");
        }
        if (!isMailConfigured()) {
            throw new ServiceUnavailableException("El envío de correos no está configurado");
        }
        const newPass = randomBytes(8).toString('hex');
        const hashedNewPass = await bcryptjs.hash(newPass, 10);

        await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.userService.updateChangePass(auth.id, true);
        const template = resetTemplate(newPass);
        await sendMail(email, template.subject, template.text, template.html);

        return {
            message: "Contraseña reseteada. Verifica tu email"
        } as AuthResponse;
    }

    async findByIdAuth(userId: number) {
        return await this.authRepository.findOneBy({ idUser: userId });
    }

    async changePassword(token: string, { newPassword }: ChangePasswordDto) {
        const datosUsuario: any = jwt.verify(token, jwtConstants.secret);
        const auth = await this.findByIdAuth(datosUsuario.id);
        if (!auth) {
            throw new UnauthorizedException("Usuario sin credenciales de autenticación");
        }
        const hashedNewPass = await bcryptjs.hash(newPassword, 10);

        await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.userService.updateChangePass(auth.id, false);

        return {
            message: "Contraseña actualizada correctamente"
        } as AuthResponse;
    }
}
