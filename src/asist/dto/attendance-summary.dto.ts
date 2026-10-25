import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';
import { SubjectEntity } from 'src/subject/entities/subject.entity';
import { CourseEntity } from 'src/course/entity/course.entity';

@ObjectType()
export class StudentAttendanceSummary {
    @Field(() => UserEntity)
    user: UserEntity;

    @Field(() => Int)
    totalAsist: number;

    @Field(() => Int)
    totalAbsences: number;

    @Field(() => Float)
    percentage: number;
}

@ObjectType()
export class SubjectAttendanceSummary {
    @Field(() => SubjectEntity)
    subject: SubjectEntity;

    @Field(() => Int)
    students: number;

    @Field(() => Int)
    classesHeld: number;

    @Field(() => Int)
    totalAsist: number;

    @Field(() => Int)
    totalAbsences: number;

    @Field(() => Float)
    percentage: number;

    @Field(() => [StudentAttendanceSummary])
    studentsSummary: StudentAttendanceSummary[];
}

@ObjectType()
export class CourseAttendanceSummary {
    @Field(() => CourseEntity)
    course: CourseEntity;

    @Field(() => Int)
    students: number;

    @Field(() => Int)
    classesHeld: number;

    @Field(() => Int)
    totalAsist: number;

    @Field(() => Int)
    totalAbsences: number;

    @Field(() => Float)
    percentage: number;

    @Field(() => [SubjectAttendanceSummary])
    subjects: SubjectAttendanceSummary[];

    @Field(() => [StudentAttendanceSummary])
    studentsSummary: StudentAttendanceSummary[];
}
