import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';
import { CourseLevel } from '../enums/course-level.enums';
import { SubjectEntity } from 'src/subject/entities/subject.entity';

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

    @OneToMany(() => SubjectEntity, subject => subject.course)
    @Field(() => [SubjectEntity], { description: 'Las asignaturas asociadas al curso' })
    subjects: SubjectEntity[];
}