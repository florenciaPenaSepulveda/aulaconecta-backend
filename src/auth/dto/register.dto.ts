import { ArgsType, Field } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { UserRoles } from "src/user/enums/user-roles.enums";

@ArgsType()
export class RegisterDto{

    @Field()
    @Transform(({value}) => value.trim())
    @IsString()
    @MinLength(1)
    firstName: string;

    @Field()
    @Transform(({value}) => value.trim())
    @IsString()
    @MinLength(1)
    lastName: string;

    @Field()
    @IsString()
    @MinLength(7)
    rut:string;

    @Field()
    @IsEmail()
    email : string; 

    @Field()
    @Transform(({value}) => value.trim())
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
    password: string;

    @Field()
    @IsEnum(UserRoles)
    role: UserRoles;

}