import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';
import { SubjectEntity } from 'src/subject/entities/subject.entity';

@ObjectType()
export class AttendanceDaySummary {
    @Field()
    date: string;

    @Field(() => Int)
    present: number;

    @Field(() => Int)
    absent: number;

    @Field(() => Float)
    percentage: number;
}

@ObjectType()
export class AttendanceMark {
    @Field()
    date: string;

    @Field()
    present: boolean;
}

@ObjectType()
export class StudentAttendanceCalendar {
    @Field(() => UserEntity)
    user: UserEntity;

    @Field(() => [AttendanceMark])
    marks: AttendanceMark[];

    @Field(() => Int)
    totalAsist: number;

    @Field(() => Int)
    totalAbsences: number;

    @Field(() => Float)
    percentage: number;
}

@ObjectType()
export class SubjectAttendanceCalendar {
    @Field(() => SubjectEntity)
    subject: SubjectEntity;

    @Field(() => [AttendanceDaySummary])
    days: AttendanceDaySummary[];

    @Field(() => [StudentAttendanceCalendar])
    students: StudentAttendanceCalendar[];
}
