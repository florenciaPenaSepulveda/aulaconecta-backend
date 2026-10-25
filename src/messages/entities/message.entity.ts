import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@ObjectType()
@Entity()
export class MessageEntity {
    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column()
    @Field(() => Int)
    fromId: number;

    @Column()
    @Field(() => Int)
    toId: number;

    @Column({ type: 'text' })
    @Field()
    content: string;

    @CreateDateColumn()
    @Field()
    createdAt: Date;
}
