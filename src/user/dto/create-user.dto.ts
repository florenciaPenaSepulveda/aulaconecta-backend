import { UserRoles } from "../enums/user-roles.enums";
import { InputType, Field} from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateUserDto{
    @Field()
    firstName : string;

    @Field()
    lastName : string;

    @Field()
    rut : string;

    @Field()
    email : string;

    @Field(() => UserRoles)
    role: UserRoles;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    password?: string;
}