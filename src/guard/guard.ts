import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { GqlExecutionContext } from "@nestjs/graphql";
import { jwtConstants } from "src/auth/constant/jwt.constants";
import { SessionService } from "src/security/session.service";

@Injectable()
export class Guard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private sessionService: SessionService,
    ) {}

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
            if (!(await this.sessionService.isCurrent(payload))) {
                throw new UnauthorizedException("Token is invalid or expired");
            }
            request.user = payload;
        } catch (error) {
            throw new UnauthorizedException("Token is invalid or expired");
        }
        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return undefined;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return undefined;
        }
        return token;
    }
}