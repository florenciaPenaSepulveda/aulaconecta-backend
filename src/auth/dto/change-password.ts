import { ArgsType, Field } from "@nestjs/graphql";
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

@ArgsType()
export class ChangePasswordDto {
    @Field()
    @IsString()
    @IsNotEmpty()
    @MaxLength(72)
    currentPassword: string;

    @Field()
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
    newPassword: string;
}
