import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { GqlExecutionContext } from "@nestjs/graphql";
import { jwtConstants } from "src/auth/constant/jwt.constants";

@Injectable()
export class Guard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    // Método canActivate: verifica si una solicitud tiene un token JWT válido
    async canActivate(context: ExecutionContext): Promise<boolean> { 

        // Obtiene el contexto de GraphQL
        const ctx = GqlExecutionContext.create(context);
        // Accede al objeto request de la solicitud
        const request = ctx.getContext().req; 
        // Extrae el token del encabezado de autorización
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException("No token found");
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: jwtConstants.secret,
            });
            request.user = payload;
        } catch (error) {

            // Si el token es inválido o expirado, lanza una excepción de no autorizado
            throw new UnauthorizedException("Token is invalid or expired");
        }
        return true; // Devuelve verdadero si el token está bien
    }

    private extractTokenFromHeader(request: any): string | undefined {
        // Extraer el token del header
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return undefined;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return undefined; // Devuelve undefined si el formato no es correcto
        }
        return token;// Devuelve el token si está correctamente formateado
    }
}