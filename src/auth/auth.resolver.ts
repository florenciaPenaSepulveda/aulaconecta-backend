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
export class AuthResolver {

    constructor (private readonly authService : AuthService){}

    @Mutation(returns => AuthResponse)
    async login(@Args() logindDto : LoginDto ): Promise<AuthResponse>{
        return this.authService.login(logindDto);
    }

    @Mutation(returns => AuthResponse)
    async forgotPass(@Args() forgotpass : ForgotPassDto): Promise<AuthResponse>{
        return this.authService.forgotpass(forgotpass);
    }

    @Mutation(returns => AuthResponse)
    async register(@Args() registerDto: RegisterDto): Promise<AuthResponse>{
        return this.authService.register(registerDto);
    }

    @Mutation (returns => AuthResponse)
    @UseGuards(Guard)
    async changePassword(@Context() context:any, @Args() changePassword: ChangePasswordDto): Promise<AuthResponse>{
        const req = context.req;
        return this.authService.changePassword(this.extractTokenFromHeader(req), changePassword);
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