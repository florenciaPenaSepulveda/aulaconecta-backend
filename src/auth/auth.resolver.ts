import { Resolver, Args, Mutation, Query, Context } from "@nestjs/graphql";

import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { AuthResponse } from "./entity/authresponse.entity";

import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { ChangePasswordDto } from "./dto/change-password";

import { Guard } from "src/guard/guard";
import { UseGuards } from "@nestjs/common";

@Resolver()
// Define el resolver de GraphQL para la autenticación
export class AuthResolver {

    // Inyecta el servicio AuthService para manejar la lógica de autenticación
    constructor (private readonly authService: AuthService) {}

    // Mutation para el inicio de sesión
    @Mutation(returns => AuthResponse)
    async login(@Args() loginDto: LoginDto): Promise<AuthResponse> {
        // Llama al servicio de autenticación para manejar el login
        return this.authService.login(loginDto);
    }

    // Mutation para la recuperación de contraseña
    @Mutation(returns => AuthResponse)
    async forgotPass(@Args() forgotpass: ForgotPassDto): Promise<AuthResponse> {
        // Llama al servicio de autenticación para manejar el restablecimiento de contraseña
        return this.authService.forgotpass(forgotpass);
    }

    // Mutation para registrar un nuevo usuario
    @Mutation(returns => AuthResponse)
    async register(@Args() registerDto: RegisterDto): Promise<AuthResponse> {
        // Llama al servicio de autenticación para manejar el registro
        return this.authService.register(registerDto);
    }

    // Mutation para cambiar la contraseña, protegido por un guardia
    @Mutation(returns => AuthResponse)
    @UseGuards(Guard) // Aplica el guardia de autenticación para proteger esta operación
    async changePassword(@Context() context: any, @Args() changePassword: ChangePasswordDto): Promise<AuthResponse> {
        // Extrae el objeto de solicitud del contexto de GraphQL
        const req = context.req;
        // Llama al servicio de autenticación para cambiar la contraseña, pasando el token extraído
        return this.authService.changePassword(this.extractTokenFromHeader(req), changePassword);
    }

    // Método privado para extraer el token JWT del encabezado de autorización
    private extractTokenFromHeader(request: any): string | undefined {
        // Obtiene el encabezado de autorización
        const authHeader = request.headers['authorization'];
        // Verifica si el encabezado existe
        if (!authHeader) {
            return undefined;
        }
        // Divide el encabezado en tipo y token
        const [type, token] = authHeader.split(' ');
        // Verifica que el tipo sea 'Bearer' y que el token esté presente
        if (type !== 'Bearer' || !token) {
            return undefined;
        }
        // Devuelve el token si está bien formateado
        return token;
    }
}
