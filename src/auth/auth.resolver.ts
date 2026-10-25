import { Resolver, Args, Mutation } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto";
import { AuthResponse } from "./entity/authresponse.entity";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { ChangePasswordDto } from "./dto/change-password";
import { Guard } from "src/guard/guard";
import { CurrentUser } from "src/guard/current-user.decorator";

const LIMITE_AUTENTICACION = { default: { limit: 10, ttl: 60000 } };

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Throttle(LIMITE_AUTENTICACION)
    @Mutation(() => AuthResponse)
    async login(@Args() loginDto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(loginDto);
    }

    @Throttle(LIMITE_AUTENTICACION)
    @Mutation(() => AuthResponse)
    async forgotPass(@Args() forgotpass: ForgotPassDto): Promise<AuthResponse> {
        return this.authService.forgotpass(forgotpass);
    }

    @Throttle(LIMITE_AUTENTICACION)
    @Mutation(() => AuthResponse)
    async register(@Args() registerDto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(registerDto);
    }

    @Throttle(LIMITE_AUTENTICACION)
    @Mutation(() => AuthResponse)
    @UseGuards(Guard)
    async changePassword(
        @CurrentUser() current: { id: number },
        @Args() changePassword: ChangePasswordDto,
    ): Promise<AuthResponse> {
        return this.authService.changePassword(current.id, changePassword);
    }
}
