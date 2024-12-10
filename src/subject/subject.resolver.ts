import { Resolver, Args, Mutation, Query, Context, Int } from '@nestjs/graphql';
import { SubjectService } from './subject.service';
import { SubjectEntity } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';
import { SubjectResponse } from './entities/subjectResponse';
import { UseGuards } from '@nestjs/common';
import { Guard } from 'src/guard/guard';
import { CreateSubjectAdminDto } from './dto/createSubjectAdmin.dto';

@Resolver(() => SubjectEntity)
export class SubjectResolver {
    
    constructor(private readonly subjectService: SubjectService) {}

    @UseGuards(Guard)
    @Mutation(() => SubjectResponse, { description: 'Crear una nueva asignatura proporcionando el nombre y número de clases.' })
    async createSubject(
        @Context() context: any,
        @Args('createSubjectInput', { description: 'Datos de entrada para crear una nueva asignatura, incluyendo nombre y número de clases.' }) 
        createSubjectDto: CreateSubjectDto
    ): Promise<SubjectResponse> {
        const req = context.req;
        return this.subjectService.addNewSubject(createSubjectDto, this.extractTokenFromHeader(req));
    }

    @Mutation(() => SubjectResponse, { description: 'Crear una nueva asignatura como administrador proporcionando el nombre, número de clases, ID del curso y ID del profesor.' })
    async addNewSubjectAdmin(
        @Args('createSubjectAdminInput', { description: 'Datos de entrada para que un administrador cree una nueva asignatura, incluyendo nombre, número de clases, ID del curso y ID del profesor.' }) 
        createSubjectAdminDto: CreateSubjectAdminDto
    ): Promise<SubjectResponse> {
        return this.subjectService.addNewSubjectAdmin(createSubjectAdminDto);
    }

    @Mutation(() => Boolean, { description: 'Eliminar una asignatura por su nombre. Retorna true si la eliminación es exitosa.' })
    async removeSubject(
        @Args('name', { description: 'El nombre de la asignatura a eliminar.' }) 
        name: string
    ): Promise<boolean> {
        return this.subjectService.deleteSubject(name);
    }

    @Mutation(() => SubjectEntity, { description: 'Actualizar una asignatura proporcionando los campos necesarios.' })
    async updateSubject(
        @Args('updateSubjectInput', { description: 'Datos de entrada para actualizar una asignatura.' }) 
        updateSubject: UpdateSubjectDto
    ): Promise<SubjectEntity> {
        return this.subjectService.updateSubject(updateSubject);
    }

    @Query(() => [SubjectEntity], { description: 'Listar todas las asignaturas.' })
    listSubject(): Promise<SubjectEntity[]> {
        return this.subjectService.findAll();
    }

    @Query(() => [SubjectEntity], { description: 'Obtener todas las asignaturas por ID de profesor, incluyendo el nombre del curso.' })
    getAllSubjectByIdTeacher(
        @Args("idTeacher", { type: () => Int, description: 'ID del profesor.' }) 
        idTeacher: number
    ): Promise<SubjectEntity[]> {
        return this.subjectService.findAllByIdTeacher(idTeacher);
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            return undefined;
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return undefined;
        }
        return token;
    }
}
