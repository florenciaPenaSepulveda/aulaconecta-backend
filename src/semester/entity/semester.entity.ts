import { Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';

@ObjectType()
@Entity()
export class SemesterEntity{

    @PrimaryGeneratedColumn()
    @Field(()=> ID)
    id: number;

    @Column()
    @Field()
    nameSemester : string;

    @Column()
    @Field()
    startDate: Date;

    @Column()
    @Field()
    endDate: Date;

    @Column()
    @Field()
    deadline : Date;
}