import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class CreateGradeDto {
    
    @Field(() => Float)
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    @Max(7)
    grade: number;

    @Field()
    @IsNotEmpty()
    studentId: number;

    @Field()
    @IsNotEmpty()
    subjectId: number;
}
