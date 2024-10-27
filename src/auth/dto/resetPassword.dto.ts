import { IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType() // Cambiado de ArgsType a InputType
export class ResetPasswordDto {
    @Field()
    @IsString()
    token: string; // El token recibido en el enlace de recuperación

    @Field()
    @IsString()
    newPassword: string; // La nueva contraseña que el usuario desea establecer
}
