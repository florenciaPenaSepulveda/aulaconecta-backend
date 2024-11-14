import { InputType, Field, Float, ID, PartialType } from '@nestjs/graphql';
import { IsNumber, Min, Max } from 'class-validator';
import { CreateGradeDto } from './createGrade.dto';

@InputType()
export class UpdateGradeDto extends PartialType(CreateGradeDto) {

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @Min(0)
    @Max(7)
    grade?: number;

    @Field({ nullable: true })
    studentId?: number;

    @Field({ nullable: true })
    subjectId?: number;
}
