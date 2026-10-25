import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['idUser', 'idSubject', 'date'])
export class AttendanceRecordEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    idUser: number;

    @Column()
    idSubject: number;

    @Column({ type: 'date' })
    date: string;

    @Column()
    present: boolean;
}
