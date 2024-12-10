import { InputType, Field, Int, } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsInt } from 'class-validator';

@InputType()
export class CreateSubjectDto {

    @Field()
    @IsNotEmpty()
    name: string;

    @Field(() => Int, { nullable: true })
    @IsInt()
    numberOfClasses: number;
    
    idTeacher: number

    @Field(() => Int)
    @IsNotEmpty()
    @IsInt()
    courseId: number;
}