import { Field, ObjectType } from '@nestjs/graphql';
import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@ObjectType()
@Entity()
export class NoticeEntity{

    @PrimaryGeneratedColumn()
    @Field()
    id: number;

    @Column()
    @Field()
    title: string;

    @Column()
    @Field()
    description: string;

    @Column({ nullable: true })
    @Field()
    imageUrl?: string;
}