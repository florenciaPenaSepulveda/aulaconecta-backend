import { Resolver, Args, Mutation } from "@nestjs/graphql";
import { LoginDto } from "./dto/login.dto";
import { ForgotPassDto } from "./dto/forgotpass.dto"; // Asegúrate de que esta importación sea correcta
import { RegisterDto } from "./dto/register.dto"; 
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { AuthResponse } from "./entity/authresponse.entity";
import { AuthService } from "./auth.service";

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    // Mutación para registrar un nuevo usuario
    @Mutation(returns => AuthResponse)
    async register(@Args('registerDto') registerDto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(registerDto);
    }

    // Mutación para iniciar sesión
    @Mutation(returns => AuthResponse)
    async login(@Args() logindDto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(logindDto);
    }

   // Mutación para solicitar un enlace de recuperación de contraseña
   @Mutation(returns => String, { description: 'Solicita un enlace para restablecer la contraseña' })
   async forgotPassword(@Args('forgotPassDto') forgotPassDto: ForgotPassDto): Promise<string> {
       return this.authService.forgotPassword(forgotPassDto); // Pasa el objeto completo
   }

    // Mutación para restablecer la contraseña
    @Mutation(returns => String, { description: 'Restablece la contraseña utilizando un token' })
    async resetPassword(@Args('resetPasswordDto') resetPasswordDto: ResetPasswordDto): Promise<string> {
        return this.authService.resetPassword(resetPasswordDto);
    }
}
