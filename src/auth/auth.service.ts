import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
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

const HASH_FICTICIO = bcryptjs.hashSync('contrasena-ficticia', 10);
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';

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
        const auth = user ? await this.authRepository.findOne({ where: { idUser: user.id } }) : null;
        const isPasswordValid = await bcryptjs.compare(password, auth ? auth.password : HASH_FICTICIO);
        if (!user || !auth || !isPasswordValid) {
            throw new UnauthorizedException(CREDENCIALES_INVALIDAS);
        }
        const token = await this.jwtService.signAsync({ id: user.id, v: auth.tokenVersion });

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
        const respuesta = { message: "Si el correo está registrado, recibirás una nueva contraseña" } as AuthResponse;
        const user = await this.userService.findOneByEmail(email);
        const auth = user ? await this.findByIdAuth(user.id) : null;
        if (!user || !auth || !isMailConfigured()) {
            return respuesta;
        }
        const newPass = randomBytes(8).toString('hex');
        const hashedNewPass = await bcryptjs.hash(newPass, 10);

        await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.userService.updateChangePass(auth.id, true);
        const template = resetTemplate(newPass);
        await sendMail(email, template.subject, template.text, template.html);

        return respuesta;
    }

    async findByIdAuth(userId: number) {
        return await this.authRepository.findOneBy({ idUser: userId });
    }

    async changePassword(userId: number, { currentPassword, newPassword }: ChangePasswordDto) {
        const auth = await this.findByIdAuth(userId);
        if (!auth) {
            throw new UnauthorizedException("Usuario sin credenciales de autenticación");
        }
        if (!(await bcryptjs.compare(currentPassword, auth.password))) {
            throw new BadRequestException("La contraseña actual no es correcta");
        }
        if (currentPassword === newPassword) {
            throw new BadRequestException("La nueva contraseña debe ser distinta de la actual");
        }
        const hashedNewPass = await bcryptjs.hash(newPassword, 10);

        const version = await this.userService.updatePassword(auth.id, hashedNewPass);
        await this.userService.updateChangePass(auth.id, false);

        return {
            message: "Contraseña actualizada correctamente",
            token: await this.jwtService.signAsync({ id: userId, v: version }),
        } as AuthResponse;
    }
}
