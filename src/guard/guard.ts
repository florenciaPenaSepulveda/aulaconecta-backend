import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { GqlExecutionContext } from "@nestjs/graphql";
import { jwtConstants } from "src/auth/constant/jwt.constants";

@Injectable()
export class Guard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {    
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req; 
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
            throw new UnauthorizedException("Token is invalid or expired");
        }
        return true; // devuelve verdadero si el token está bien
    }

    private extractTokenFromHeader(request: any): string | undefined {
        // Extraer el token del header
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return undefined;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return undefined; // lo devuelve si no está bien formateado
        }
        return token;
    }
}