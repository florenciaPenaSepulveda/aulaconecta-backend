//Nest
import { Injectable, UnauthorizedException,  BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
//JWT
import { JwtService } from "@nestjs/jwt";
//import { jwtConstants } from "./constant/jwt.constants";
//Entity
import { AuthEntity } from "./entity/auth.entity";
//Service
import { UserService } from "src/user/user.service";
//DTO
import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { RegisterDto } from "./dto/register.dto";
//Herramientas
import * as bcryptjs from "bcryptjs";
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
//Respuesta
import { AuthResponse } from "./entity/authresponse.entity";
//Enums
import { UserRoles } from "src/user/enums/user-roles.enums";
import { ChangePasswordDto } from "./dto/change-password";

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

        const payload = { id: user.id};
        const token = await this.jwtService.signAsync(payload);

        return {
            message: "Inicio de sesion exitoso",
            token,
            role:user.role,
            firstName: user.firstName,
            id: user.id
        } as AuthResponse
    }

    async register({ password, email, firstName, lastName, role, rut}: RegisterDto) {

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
            message: "Usuario creado con exito",
        }as AuthResponse;
    }

    async forgotpass({email}: ForgotPassDto){
        const user = await this.userService.findOneByEmail(email);

        if (!user) { 
            throw new UnauthorizedException("Email no valido");
            }
        const newPass = randomBytes(8).toString('hex');
        const hashedNewPass = await bcryptjs.hash(newPass, 10);

        const auth = await this.findByIdAuth(user.id);

        await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.sendPasswordResetEmail(email, newPass);
        
        return {
            message: "Contraseña reseteada. Verifica tu email"
        } as AuthResponse;
        
    }

    async sendPasswordResetEmail(email: string, newPassword: string) {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'marcapp.service@gmail.com',
                pass: 'REDACTED'
            }
        });

        const mailOptions = {
            from: '"MarcApp" <marcapp.service@gmail.com>',
            to: email,
            subject: 'Tu nueva contraseña', 
            text: `Tu nueva contraseña es: ${newPassword}`,
            html: `
                <html>
                    <body>
                        <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #333;">
                            <h2>Hola,</h2>
                            <p>Hemos restablecido tu contraseña. Aquí tienes tu nueva contraseña para acceder a <strong>MarcApp</strong>:</p>
                            <p style="font-size: 18px; color: #555;">
                                <strong>Contraseña:</strong> <span style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 4px; font-weight: bold;">${newPassword}</span>
                            </p>
                            <p>Te recomendamos cambiar esta contraseña por una propia tan pronto como inicies sesión.</p>
                            <p>Si no has solicitado un restablecimiento de contraseña, por favor ignora este correo o ponte en contacto con nosotros.</p>
                            <footer>
                                <p>Saludos cordiales,</p>
                                <p>Equipo de <strong>MarcApp</strong></p>
                            </footer>
                        </div>
                    </body>
                </html>
            `
        };
        await transporter.sendMail(mailOptions);
    }

    async findByIdAuth(userId: number){
        return await this.authRepository.findOneBy({idUser: userId});
    }

    async changePassword(token, {newPassword}: ChangePasswordDto){

        const auth = await this.findByIdAuth(token.id);
        const hashedNewPass = await bcryptjs.hash(newPassword, 10);

        await this.userService.updatePassword(auth.id, hashedNewPass);

        return {
            message: "Contraseña reseteada correctamente"
        } as AuthResponse;
    }
}