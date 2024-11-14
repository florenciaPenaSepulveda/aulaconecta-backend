import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { CreateSubjectDto } from "./dto/createSubject.dto";
import { UpdateSubjectDto } from "./dto/updateSubject.dto";
import { SubjectResponse } from "./entities/subjectResponse";
import { jwtConstants } from "src/auth/constant/jwt.constants";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SubjectService{

    constructor (
        @InjectRepository(SubjectEntity)
        private readonly subjectRepository : Repository<SubjectEntity>
    ){}

    async addNewSubject(createSubjectDto: CreateSubjectDto, token:string): Promise<SubjectResponse>{
        let userData:any;
        userData = jwt.verify(token, jwtConstants.secret);

        createSubjectDto.idTeacher = userData.id;

        try {
            await this.subjectRepository.save(createSubjectDto);
                return {
                    isCreateSubject:true
                }as SubjectResponse
        } catch (error) {
            console.log(error)
        }
        return {
            isCreateSubject: false
        }as SubjectResponse
    }

    async deleteSubject(name :string) : Promise<boolean>{
        const subject = await this.subjectRepository.findOne({where: {name}});
        if(!subject){
            throw new BadRequestException('Asignatura con el nombre "${name}" no encontrado');
        }
        await this.subjectRepository.remove(subject);
        return true;
    }

    async updateSubject(updateSubjectDto: UpdateSubjectDto): Promise<SubjectEntity>{
        const {name , newName , numberOfClasses} = updateSubjectDto;
        const subject = await this.subjectRepository.findOne({where: {name}});

        if (newName !== undefined){
            throw new BadRequestException('Asignatura con el nombre "${name}" no encontrado');
        }
        if (numberOfClasses !== undefined){
            subject.numberOfClasses = numberOfClasses
        }

        await this.subjectRepository.save(subject);
        return subject;
    }

    async findAll(): Promise<SubjectEntity[]> {
        return await this.subjectRepository.find();
    }
}