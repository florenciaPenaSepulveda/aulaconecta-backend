import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {ObjectType, Field, ID} from '@nestjs/graphql';

@ObjectType()
@Entity()
export class AsistEntity {

    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column()
    @Field()
    idUser: number;

    @Column()
    @Field()
    idSubject: number;

    @Column({default: 0})
    @Field()
    asist: number;

    @Column({default: 0})
    @Field()
    absences: number;
}