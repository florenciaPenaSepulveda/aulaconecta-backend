import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

@InputType()
export class UpdateUserDto {
    @Field({ nullable: true })
    @IsOptional()
    @Transform(recortar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @Transform(recortar)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @Transform(recortar)
    @IsEmail()
    @MaxLength(150)
    email?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    guardianRut?: string;
}
