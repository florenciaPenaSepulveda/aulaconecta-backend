// Nest
import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
// JWT
import { JwtService } from "@nestjs/jwt";
import * as jwt from 'jsonwebtoken';
import { jwtConstants } from "./constant/jwt.constants";
// Entity
import { AuthEntity } from "./entity/auth.entity";
// Service
import { UserService } from "src/user/user.service";
// DTOs
import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { RegisterDto } from "./dto/register.dto";
// Herramientas
import * as bcryptjs from "bcryptjs";
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
// Respuesta
import { AuthResponse } from "./entity/authresponse.entity";
// Enums
import { UserRoles } from "src/user/enums/user-roles.enums";
import { ChangePasswordDto } from "./dto/change-password";

@Injectable()
export class AuthService {

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    // Método de inicio de sesión
    async login({ email, password }: LoginDto) {
        // Busca al usuario por su email
        const user = await this.userService.findOneByEmail(email);

        // Si el usuario no existe, lanza una excepción de no autorizado
        if (!user) {
            throw new UnauthorizedException("Email no válido");
        }

        // Busca las credenciales de autenticación del usuario en el repositorio
        const auth = await this.authRepository.findOne({ where: { idUser: user.id } });
        if (!auth) {
            throw new UnauthorizedException("Usuario sin credenciales de autenticación");
        }

        // Verifica si la contraseña proporcionada es válida
        const isPasswordValid = await bcryptjs.compare(password, auth.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Contraseña o email no válido");
        }

        // Genera el token JWT con el ID del usuario
        const payload = { id: user.id };
        const token = await this.jwtService.signAsync(payload);

        // Devuelve el token y la información del usuario
        return {
            message: "Inicio de sesión exitoso",
            token,
            role: user.role,
            firstName: user.firstName,
            id: user.id,
            isChangePassword: auth.isChangePass
        } as AuthResponse;
    }

    // Método de registro de usuario
    async register({ password, email, firstName, lastName, role, rut }: RegisterDto) {

        // Verifica que el rol sea Teacher o Parents, de lo contrario lanza una excepción
        if (role !== UserRoles.Teacher && role !== UserRoles.Parents) {
            throw new BadRequestException('Solo profesores y padres pueden registrarse a través de esta función.');
        }

        // Comprueba si el email ya está registrado
        const user = await this.userService.findOneByEmail(email);

        if (user) {
            throw new BadRequestException("El email ya se encuentra registrado");
        }

        // Agrega el nuevo usuario
        await this.userService.addNewUser({
            firstName,
            lastName,
            rut,
            email,
            password,
            role
        });

        // Devuelve un mensaje de éxito
        return {
            message: "Usuario creado con éxito",
        } as AuthResponse;
    }

    // Método de recuperación de contraseña
    async forgotpass({ email }: ForgotPassDto) {
        // Busca al usuario por su email
        const user = await this.userService.findOneByEmail(email);

        // Si el usuario no existe, lanza una excepción de no autorizado
        if (!user) { 
            throw new UnauthorizedException("Email no válido");
        }

        // Genera una nueva contraseña aleatoria
        const newPass = randomBytes(8).toString('hex');
        const hashedNewPass = await bcryptjs.hash(newPass, 10);

        // Busca las credenciales de autenticación del usuario
        const auth = await this.findByIdAuth(user.id);

        // Actualiza la contraseña en la base de datos y envía un correo con la nueva contraseña
        await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.userService.updateChangePass(auth.id, true);
        await this.sendPasswordResetEmail(email, newPass);
        

        // Devuelve un mensaje de éxito
        return {
            message: "Contraseña reseteada. Verifica tu email"
        } as AuthResponse;
    }

    // Método que envía un correo electrónico con la nueva contraseña
    async sendPasswordResetEmail(email: string, newPassword: string) {

        // Configura el transportador de correo usando Gmail
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'marcapp.service@gmail.com',
                pass: 'REDACTED'
            }
        });

        // Define las opciones del correo electrónico
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
        // Envía el correo electrónico
        await transporter.sendMail(mailOptions);
    }

    // Busca credenciales de autenticación por el ID de usuario
    async findByIdAuth(userId: number) {
        return await this.authRepository.findOneBy({ idUser: userId });
    }

    // Método para cambiar la contraseña del usuario autenticado
    async changePassword(token, { newPassword }: ChangePasswordDto) {

        let datosUsuario: any;
        datosUsuario = jwt.verify(token, jwtConstants.secret );
        // Busca las credenciales de autenticación por el ID del token
        const auth = await this.findByIdAuth(datosUsuario.id);
        // Hashea la nueva contraseña
        const hashedNewPass = await bcryptjs.hash(newPassword, 10);

        // Actualiza la contraseña en la base de datos
        await this.userService.updatePassword(auth.id, hashedNewPass);

        //Actualiza el estado de isChangePass
        await this.userService.updateChangePass(auth.id, false);

        // Devuelve un mensaje de éxito
        return {
            message: "Contraseña reseteada correctamente"
        } as AuthResponse;
    }
}
