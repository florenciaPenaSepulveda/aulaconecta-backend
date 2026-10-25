import { Injectable, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { CreateSubjectDto } from "./dto/createSubject.dto";
import { UpdateSubjectDto } from "./dto/updateSubject.dto";
import { SubjectResponse } from "./entities/subjectResponse";
import { UserEntity } from "src/user/entity/user.entity";
import { UserRoles } from "src/user/enums/user-roles.enums";
import { CourseEntity } from "src/course/entity/course.entity";
import { AsistEntity } from "src/asist/entities/asist.entity";
import { AttendanceRecordEntity } from "src/asist/entities/attendance-record.entity";
import { GradeEntity } from "src/grades/entities/grade.entity";
import { CreateSubjectAdminDto } from "./dto/createSubjectAdmin.dto";

@Injectable()
export class SubjectService {
    private readonly logger = new Logger(SubjectService.name);

    constructor (
        @InjectRepository(SubjectEntity)
        private readonly subjectRepository : Repository<SubjectEntity>,

        @InjectRepository(CourseEntity)
        private readonly courseRepository : Repository<CourseEntity>
    ){}

    async assertCanManage(actor: UserEntity, subjectId: number): Promise<void> {
        if (actor.role !== UserRoles.Teacher) {
            return;
        }
        const subject = await this.subjectRepository.findOne({ where: { id: subjectId } });
        if (!subject) {
            throw new BadRequestException('La asignatura no existe');
        }
        if (subject.idTeacher !== actor.id) {
            throw new ForbiddenException('No tienes permisos sobre esta asignatura');
        }
    }

    async addNewSubject(createSubjectDto: CreateSubjectDto, teacherId: number): Promise<SubjectResponse> {
        const course = await this.courseRepository.findOne({ where: { id: createSubjectDto.courseId } });
        if (!course) {
            throw new BadRequestException(`Curso con el ID "${createSubjectDto.courseId}" no encontrado`);
        }

        const newSubject = this.subjectRepository.create({
            name: createSubjectDto.name,
            numberOfClasses: createSubjectDto.numberOfClasses || 0,
            idTeacher: teacherId,
            course: course
        });

        try {
            await this.subjectRepository.save(newSubject);
            return {
                isCreateSubject: true
            } as SubjectResponse;
        } catch (error) {
            this.logger.error(error);
            return {
                isCreateSubject: false
            } as SubjectResponse;
        }
    }

    async addNewSubjectAdmin(createSubjectAdminDto: CreateSubjectAdminDto): Promise<SubjectResponse> {
        const { name, numberOfClasses, courseId, idTeacher } = createSubjectAdminDto;
    
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw new BadRequestException(`Curso con ID "${courseId}" no encontrado`);
        }

        if (idTeacher <= 0) {
            throw new BadRequestException(`ID de profesor "${idTeacher}" no válido`);
        }

        const newSubject = this.subjectRepository.create({
            name,
            numberOfClasses: numberOfClasses || 0,
            idTeacher,
            course,
        });
    
        try {
            await this.subjectRepository.save(newSubject);
            return {
                isCreateSubject: true
            } as SubjectResponse;
        } catch (error) {
            this.logger.error(error);
            return {
                isCreateSubject: false
            } as SubjectResponse;
        }
    }

    async deleteSubject(name: string, actor: UserEntity): Promise<boolean> {
        const subject = await this.subjectRepository.findOne({ where: { name } });
        if (!subject) {
            throw new BadRequestException(`Asignatura con el nombre "${name}" no encontrado`);
        }
        await this.assertCanManage(actor, subject.id);
        await this.subjectRepository.remove(subject);
        return true;
    }

    async updateSubject(updateSubjectDto: UpdateSubjectDto, actor: UserEntity): Promise<SubjectEntity> {
        const { name, newName, numberOfClasses, courseId } = updateSubjectDto;
        const subject = await this.subjectRepository.findOne({ where: { name }, relations: ['course'] });

        if (!subject) {
            throw new BadRequestException(`Asignatura con el nombre "${name}" no encontrado`);
        }
        await this.assertCanManage(actor, subject.id);

        if (newName !== undefined) {
            subject.name = newName;
        }
        if (numberOfClasses !== undefined) {
            subject.numberOfClasses = numberOfClasses;
        }
        if (courseId !== undefined) {
            const course = await this.courseRepository.findOne({ where: { id: courseId } });
            if (!course) {
                throw new BadRequestException(`Curso con el ID "${courseId}" no encontrado`);
            }
            subject.course = course;
        }

        await this.subjectRepository.save(subject);
        return subject;
    }

    async deleteSubjectById(id: number, actor: UserEntity): Promise<boolean> {
        const subject = await this.subjectRepository.findOne({ where: { id } });
        if (!subject) {
            throw new BadRequestException('La asignatura no existe');
        }
        await this.assertCanManage(actor, subject.id);
        await this.subjectRepository.manager.delete(AsistEntity, { idSubject: id });
        await this.subjectRepository.manager.delete(AttendanceRecordEntity, { idSubject: id });
        await this.subjectRepository.manager.delete(GradeEntity, { subjectId: id });
        await this.subjectRepository.remove(subject);
        return true;
    }

    async findById(id: number): Promise<SubjectEntity | null> {
        return await this.subjectRepository.findOne({ where: { id }, relations: ['course'] });
    }

    async findAll(): Promise<SubjectEntity[]> {
        return await this.subjectRepository.find({ relations: ['course'] });
    }

    async findAllByIdTeacher(idTeacher: number): Promise<SubjectEntity[]> {
        return await this.subjectRepository.find({
            where: { idTeacher },
            relations: ['course'],
        });
    }
}
