import { IsString, IsEmail, IsEnum } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { UserRoles } from '../enums/user-roles.enums';

@InputType()
export class CreateUserDto {
    @Field()
    @IsString()
    firstName: string;

    @Field()
    @IsString()
    lastName: string;

    @Field()
    @IsString()
    rut: string;

    @Field()
    @IsEmail()
    email: string;

    @Field(() => UserRoles)
    @IsEnum(UserRoles)
    role: UserRoles;

    @Field()
    @IsString()
    password: string;
}
