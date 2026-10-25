import { ArgsType, Field } from "@nestjs/graphql";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

@ArgsType()
export class ChangePasswordDto {
    @Field()
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
    newPassword: string;
}
