import { ObjectType } from '@nestjs/graphql';
import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@ObjectType()
@Entity()
export class AuthEntity{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    idUser: number;

    @Column()
    password:string;
}