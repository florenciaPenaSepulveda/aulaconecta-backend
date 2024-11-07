import { ObjectType } from '@nestjs/graphql';
import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

export class UserTokenEntity{

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    idUser: number;

    @Column() 
    token: string;

    @Column()
    platform: string;
}