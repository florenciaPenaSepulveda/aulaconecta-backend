import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';

@InputType()
export class CreateSubjectAdminDto {

    @Field()
    @IsNotEmpty()
    name: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    numberOfClasses?: number;

    @Field(() => Int)
    @IsNotEmpty()
    @IsInt()
    courseId: number;

    @Field(() => Int)
    @IsNotEmpty()
    @IsInt()
    idTeacher: number;
}
