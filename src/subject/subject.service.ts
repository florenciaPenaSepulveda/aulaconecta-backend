import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { CreateSubjectDto } from "./dto/createSubject.dto";
import { UpdateSubjectDto } from "./dto/updateSubject.dto";
import { SubjectResponse } from "./entities/subjectResponse";
import { jwtConstants } from "src/auth/constant/jwt.constants";
import * as jwt from 'jsonwebtoken';
import { CourseEntity } from "src/course/entity/course.entity";
import { CreateSubjectAdminDto } from "./dto/createSubjectAdmin.dto";

@Injectable()
export class SubjectService {

    constructor (
        @InjectRepository(SubjectEntity)
        private readonly subjectRepository : Repository<SubjectEntity>,

        @InjectRepository(CourseEntity)
        private readonly courseRepository : Repository<CourseEntity>
    ){}

    async addNewSubject(createSubjectDto: CreateSubjectDto, token: string): Promise<SubjectResponse> {
        let userData: any;
        try {
            userData = jwt.verify(token, jwtConstants.secret);
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }

        const course = await this.courseRepository.findOne({ where: { id: createSubjectDto.courseId } });
        if (!course) {
            throw new BadRequestException(`Curso con el ID "${createSubjectDto.courseId}" no encontrado`);
        }

        const newSubject = this.subjectRepository.create({
            name: createSubjectDto.name,
            numberOfClasses: createSubjectDto.numberOfClasses || 0,
            idTeacher: userData.id,
            course: course
        });

        try {
            await this.subjectRepository.save(newSubject);
            return {
                isCreateSubject: true
            } as SubjectResponse;
        } catch (error) {
            console.error(error);
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
            console.error(error);
            return {
                isCreateSubject: false
            } as SubjectResponse;
        }
    }

    async deleteSubject(name: string): Promise<boolean> {
        const subject = await this.subjectRepository.findOne({ where: { name } });
        if (!subject) {
            throw new BadRequestException(`Asignatura con el nombre "${name}" no encontrado`);
        }
        await this.subjectRepository.remove(subject);
        return true;
    }

    async updateSubject(updateSubjectDto: UpdateSubjectDto): Promise<SubjectEntity> {
        const { name, newName, numberOfClasses, courseId } = updateSubjectDto;
        const subject = await this.subjectRepository.findOne({ where: { name }, relations: ['course'] });

        if (!subject) {
            throw new BadRequestException(`Asignatura con el nombre "${name}" no encontrado`);
        }

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
