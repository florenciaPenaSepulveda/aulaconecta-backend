import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';

@ObjectType({ description: 'La entidad Subject que representa una asignatura' })
@Entity()
export class SubjectEntity{

    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    numberOfClasses: number;
}