import { UserRoles } from "../enums/user-roles.enums";
import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

@InputType()
export class CreateUserDto {
    @Field()
    @Transform(recortar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName: string;

    @Field()
    @Transform(recortar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName: string;

    @Field()
    @Transform(recortar)
    @IsString()
    @MinLength(7)
    @MaxLength(12)
    rut: string;

    @Field()
    @Transform(recortar)
    @IsEmail()
    @MaxLength(150)
    email: string;

    @Field(() => UserRoles)
    @IsEnum(UserRoles)
    role: UserRoles;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe incluir letras y números' })
    password?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    guardianRut?: string;
}
