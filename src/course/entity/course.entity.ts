import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';
import { CourseLevel } from '../enums/course-level.enums';

@ObjectType()
@Entity()
export class CourseEntity{
    @PrimaryGeneratedColumn()
    @Field(()=> ID)
    id:number;

    @Column()
    @Field()
    nameCourse : string;

    @Column({
        type: "enum",
        enum: CourseLevel,
        default: CourseLevel.Basica,
    })
    @Field(() => CourseLevel)
    level: CourseLevel;
}