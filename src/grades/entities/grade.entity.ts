import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType({ description: 'La entidad Grade que representa una calificación de un estudiante en una asignatura' })
@Entity('grades_entity')
export class GradeEntity {

    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column('decimal', { precision: 5, scale: 2 })
    @Field(() => Float, { description: 'La nota obtenida' })
    grade: number;

    @Column()
    @Field({ description: 'ID del estudiante' })
    studentId: number;

    @Column()
    @Field({ description: 'ID de la asignatura' })
    subjectId: number;
}
