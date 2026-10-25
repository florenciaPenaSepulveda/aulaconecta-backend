import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsistEntity } from "./entities/asist.entity";
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAsistDto } from './dto/create-asist.dto';
import { UserService } from 'src/user/user.service';
import { UserWithAttendanceDto } from './dto/user-with-attendance.dto';
import { StudentAttendanceDto } from './dto/student-attendance.dto';
import { SubjectEntity } from 'src/subject/entities/subject.entity';
import { UserRoles } from 'src/user/enums/user-roles.enums';
import { UserEntity } from 'src/user/entity/user.entity';
import { CourseEntity } from 'src/course/entity/course.entity';
import { isValidDateString, todayLocal, toPercentage } from './attendance.util';
import { AttendanceRecordEntity } from './entities/attendance-record.entity';
import { SubjectAttendanceCalendar } from './dto/attendance-calendar.dto';
import {
    CourseAttendanceSummary,
    StudentAttendanceSummary,
    SubjectAttendanceSummary,
} from './dto/attendance-summary.dto';

@Injectable()
export class AsistService {
    constructor(
        @InjectRepository(AsistEntity)
        private readonly asistRepository: Repository<AsistEntity>,
        @InjectRepository(AttendanceRecordEntity)
        private readonly recordRepository: Repository<AttendanceRecordEntity>,
        @InjectRepository(SubjectEntity)
        private readonly subjectRepository: Repository<SubjectEntity>,
        @InjectRepository(CourseEntity)
        private readonly courseRepository: Repository<CourseEntity>,
        private readonly userService: UserService,
    ) {}

    async addAsistencias(createAsistDto: CreateAsistDto): Promise<AsistEntity[]> {
        const date = createAsistDto.date ?? todayLocal();
        if (!isValidDateString(date)) {
            throw new BadRequestException('La fecha debe tener el formato AAAA-MM-DD');
        }
        if (date > todayLocal()) {
            throw new BadRequestException('No se puede registrar asistencia en una fecha futura');
        }
        const updated: AsistEntity[] = [];
        for (const { idUser, idSubject, asist } of createAsistDto.asistencias) {
            const present = asist === 1;
            const counter =
                (await this.asistRepository.findOne({ where: { idUser, idSubject } })) ??
                this.asistRepository.create({ idUser, idSubject, asist: 0, absences: 0 });
            const record = await this.recordRepository.findOne({ where: { idUser, idSubject, date } });

            if (!record) {
                counter.asist += present ? 1 : 0;
                counter.absences += present ? 0 : 1;
                await this.recordRepository.save(this.recordRepository.create({ idUser, idSubject, date, present }));
            } else if (record.present !== present) {
                counter.asist += present ? 1 : -1;
                counter.absences += present ? -1 : 1;
                record.present = present;
                await this.recordRepository.save(record);
            }
            updated.push(await this.asistRepository.save(counter));
        }
        return updated;
    }

    async enrollStudent(idUser: number, idSubject: number): Promise<boolean> {
        const student = await this.userService.findUserById(idUser);
        if (student.role !== UserRoles.Student) {
            throw new BadRequestException('Solo se pueden inscribir estudiantes');
        }
        const subject = await this.subjectRepository.findOne({ where: { id: idSubject } });
        if (!subject) {
            throw new BadRequestException('La asignatura no existe');
        }
        const existing = await this.asistRepository.findOne({ where: { idUser, idSubject } });
        if (!existing) {
            await this.asistRepository.save(
                this.asistRepository.create({ idUser, idSubject, asist: 0, absences: 0 }),
            );
        }
        return true;
    }

    async unenrollStudent(idUser: number, idSubject: number): Promise<boolean> {
        await this.asistRepository.delete({ idUser, idSubject });
        await this.recordRepository.delete({ idUser, idSubject });
        return true;
    }

    async listUsersBySubject(idSubject: number): Promise<UserWithAttendanceDto[]> {
        const records = await this.asistRepository.find({ where: { idSubject } });
        const users = await this.userService.findUsersByIds(records.map(r => r.idUser));
        return records
            .map(record => ({
                user: users.find(u => u.id === record.idUser),
                totalAsist: record.asist,
                totalAbsences: record.absences,
            }))
            .filter(item => item.user);
    }

    async attendanceByStudent(idUser: number): Promise<StudentAttendanceDto[]> {
        const records = await this.asistRepository.find({ where: { idUser } });
        const result: StudentAttendanceDto[] = [];
        for (const record of records) {
            const subject = await this.subjectRepository.findOne({
                where: { id: record.idSubject },
                relations: ['course'],
            });
            if (subject) {
                result.push({ subject, totalAsist: record.asist, totalAbsences: record.absences });
            }
        }
        return result;
    }

    private summarizeStudents(records: AsistEntity[], usersById: Map<number, UserEntity>): StudentAttendanceSummary[] {
        const totals = new Map<number, { present: number; absent: number }>();
        for (const record of records) {
            const current = totals.get(record.idUser) ?? { present: 0, absent: 0 };
            current.present += record.asist;
            current.absent += record.absences;
            totals.set(record.idUser, current);
        }
        return [...totals.entries()]
            .filter(([idUser]) => usersById.has(idUser))
            .map(([idUser, { present, absent }]) => ({
                user: usersById.get(idUser),
                totalAsist: present,
                totalAbsences: absent,
                percentage: toPercentage(present, absent),
            }))
            .sort((a, b) => a.user.lastName.localeCompare(b.user.lastName));
    }

    private summarizeSubject(
        subject: SubjectEntity,
        records: AsistEntity[],
        usersById: Map<number, UserEntity>,
    ): SubjectAttendanceSummary {
        const subjectRecords = records.filter(record => record.idSubject === subject.id);
        const present = subjectRecords.reduce((sum, record) => sum + record.asist, 0);
        const absent = subjectRecords.reduce((sum, record) => sum + record.absences, 0);
        return {
            subject,
            students: subjectRecords.length,
            classesHeld: subjectRecords.reduce((max, record) => Math.max(max, record.asist + record.absences), 0),
            totalAsist: present,
            totalAbsences: absent,
            percentage: toPercentage(present, absent),
            studentsSummary: this.summarizeStudents(subjectRecords, usersById),
        };
    }

    private async usersMap(records: AsistEntity[]): Promise<Map<number, UserEntity>> {
        const users = await this.userService.findUsersByIds([...new Set(records.map(record => record.idUser))]);
        return new Map(users.map(user => [user.id, user]));
    }

    async subjectAttendanceSummary(subjectId: number): Promise<SubjectAttendanceSummary> {
        const subject = await this.subjectRepository.findOne({ where: { id: subjectId }, relations: ['course'] });
        if (!subject) {
            throw new BadRequestException('La asignatura no existe');
        }
        const records = await this.asistRepository.find({ where: { idSubject: subjectId } });
        return this.summarizeSubject(subject, records, await this.usersMap(records));
    }

    async courseAttendanceSummaries(): Promise<CourseAttendanceSummary[]> {
        const courses = await this.courseRepository.find({ order: { id: 'ASC' } });
        const subjects = await this.subjectRepository.find({ relations: ['course'] });
        const records = await this.asistRepository.find();
        const usersById = await this.usersMap(records);

        return courses.map(course => {
            const courseSubjects = subjects.filter(subject => subject.course?.id === course.id);
            const subjectIds = new Set(courseSubjects.map(subject => subject.id));
            const courseRecords = records.filter(record => subjectIds.has(record.idSubject));
            const present = courseRecords.reduce((sum, record) => sum + record.asist, 0);
            const absent = courseRecords.reduce((sum, record) => sum + record.absences, 0);
            const subjectSummaries = courseSubjects.map(subject => this.summarizeSubject(subject, records, usersById));
            return {
                course,
                students: new Set(courseRecords.map(record => record.idUser)).size,
                classesHeld: subjectSummaries.reduce((sum, item) => sum + item.classesHeld, 0),
                totalAsist: present,
                totalAbsences: absent,
                percentage: toPercentage(present, absent),
                subjects: subjectSummaries,
                studentsSummary: this.summarizeStudents(courseRecords, usersById),
            };
        });
    }

    async subjectAttendanceCalendar(subjectId: number): Promise<SubjectAttendanceCalendar> {
        const subject = await this.subjectRepository.findOne({ where: { id: subjectId }, relations: ['course'] });
        if (!subject) {
            throw new BadRequestException('La asignatura no existe');
        }
        const records = await this.recordRepository.find({ where: { idSubject: subjectId }, order: { date: 'ASC' } });
        const enrolled = await this.asistRepository.find({ where: { idSubject: subjectId } });
        const userIds = [...new Set([...enrolled.map(item => item.idUser), ...records.map(item => item.idUser)])];
        const users = await this.userService.findUsersByIds(userIds);

        const dates = [...new Set(records.map(record => record.date))];
        const days = dates.map(date => {
            const dayRecords = records.filter(record => record.date === date);
            const present = dayRecords.filter(record => record.present).length;
            const absent = dayRecords.length - present;
            return { date, present, absent, percentage: toPercentage(present, absent) };
        });

        const students = users
            .map(user => {
                const marks = records
                    .filter(record => record.idUser === user.id)
                    .map(record => ({ date: record.date, present: record.present }));
                const present = marks.filter(mark => mark.present).length;
                const absent = marks.length - present;
                return { user, marks, totalAsist: present, totalAbsences: absent, percentage: toPercentage(present, absent) };
            })
            .sort((a, b) => a.user.lastName.localeCompare(b.user.lastName));

        return { subject, days, students };
    }
}
