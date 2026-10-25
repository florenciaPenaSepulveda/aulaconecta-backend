import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SubjectEntity } from 'src/subject/entities/subject.entity';

@ObjectType()
export class StudentAttendanceDto {
    @Field(() => SubjectEntity)
    subject: SubjectEntity;

    @Field(() => Int)
    totalAsist: number;

    @Field(() => Int)
    totalAbsences: number;
}
