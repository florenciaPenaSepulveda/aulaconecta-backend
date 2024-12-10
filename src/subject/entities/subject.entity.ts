import { Entity, PrimaryGeneratedColumn, Column, ManyToOne} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';
import { CourseEntity } from 'src/course/entity/course.entity';

@ObjectType({ description: 'La entidad Subject que representa una asignatura' })
@Entity()
export class SubjectEntity{

    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column()
    @Field()
    name: string;

    @ManyToOne(() => CourseEntity, course => course.subjects, { eager: true })
    @Field(() => CourseEntity, { description: 'El curso al que pertenece la asignatura' })
    course: CourseEntity;

    @Column()
    @Field()
    numberOfClasses: number;

    @Column()
    @Field()
    idTeacher : number;
}