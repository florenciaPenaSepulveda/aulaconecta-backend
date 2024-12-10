import { InputType, Field } from '@nestjs/graphql';
import { CourseLevel } from '../enums/course-level.enums';

@InputType()
export class UpdateCourseDto{
    @Field()
    nameCourse: string

    @Field({nullable: true})
    newName?: string;

    @Field(()=> CourseLevel)
    level: CourseLevel;

    @Field(() => CourseLevel, {nullable:true})
    newLevel?: CourseLevel;
}