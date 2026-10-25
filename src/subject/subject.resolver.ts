import { Resolver, Args, Mutation, Query, Int } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectEntity } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';
import { SubjectResponse } from './entities/subjectResponse';
import { CreateSubjectAdminDto } from './dto/createSubjectAdmin.dto';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';
import { UserService } from 'src/user/user.service';
import { UserRoles } from 'src/user/enums/user-roles.enums';

@Resolver(() => SubjectEntity)
@UseGuards(Guard)
export class SubjectResolver {
    constructor(
        private readonly subjectService: SubjectService,
        private readonly userService: UserService,
    ) {}

    @Mutation(() => SubjectResponse, { description: 'Crear una nueva asignatura proporcionando el nombre y número de clases.' })
    async createSubject(
        @CurrentUser() current: { id: number },
        @Args('createSubjectInput', { description: 'Datos de entrada para crear una nueva asignatura, incluyendo nombre y número de clases.' })
        createSubjectDto: CreateSubjectDto,
    ): Promise<SubjectResponse> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.subjectService.addNewSubject(createSubjectDto, actor.id);
    }

    @Mutation(() => SubjectResponse, { description: 'Crear una nueva asignatura como administrador proporcionando el nombre, número de clases, ID del curso y ID del profesor.' })
    async addNewSubjectAdmin(
        @CurrentUser() current: { id: number },
        @Args('createSubjectAdminInput', { description: 'Datos de entrada para que un administrador cree una nueva asignatura, incluyendo nombre, número de clases, ID del curso y ID del profesor.' })
        createSubjectAdminDto: CreateSubjectAdminDto,
    ): Promise<SubjectResponse> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.subjectService.addNewSubjectAdmin(createSubjectAdminDto);
    }

    @Mutation(() => Boolean, { description: 'Eliminar una asignatura por su nombre. Retorna true si la eliminación es exitosa.' })
    async removeSubject(
        @CurrentUser() current: { id: number },
        @Args('name', { description: 'El nombre de la asignatura a eliminar.' })
        name: string,
    ): Promise<boolean> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.subjectService.deleteSubject(name, actor);
    }

    @Mutation(() => SubjectEntity, { description: 'Actualizar una asignatura proporcionando los campos necesarios.' })
    async updateSubject(
        @CurrentUser() current: { id: number },
        @Args('updateSubjectInput', { description: 'Datos de entrada para actualizar una asignatura.' })
        updateSubject: UpdateSubjectDto,
    ): Promise<SubjectEntity> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.subjectService.updateSubject(updateSubject, actor);
    }

    @Query(() => [SubjectEntity], { description: 'Listar todas las asignaturas.' })
    async listSubject(@CurrentUser() current: { id: number }): Promise<SubjectEntity[]> {
        await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.subjectService.findAll();
    }

    @Mutation(() => Boolean, { description: 'Eliminar una asignatura por su ID.' })
    async deleteSubjectById(
        @CurrentUser() current: { id: number },
        @Args('id', { type: () => Int }) id: number,
    ): Promise<boolean> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.subjectService.deleteSubjectById(id, actor);
    }

    @Query(() => SubjectEntity, { nullable: true, description: 'Obtener una asignatura por su ID.' })
    async subjectById(
        @CurrentUser() current: { id: number },
        @Args('id', { type: () => Int }) id: number,
    ): Promise<SubjectEntity | null> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, id);
        return this.subjectService.findById(id);
    }

    @Query(() => [SubjectEntity], { description: 'Obtener todas las asignaturas por ID de profesor, incluyendo el nombre del curso.' })
    async getAllSubjectByIdTeacher(
        @CurrentUser() current: { id: number },
        @Args('idTeacher', { type: () => Int, description: 'ID del profesor.' })
        idTeacher: number,
    ): Promise<SubjectEntity[]> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        if (actor.role === UserRoles.Teacher && actor.id !== idTeacher) {
            throw new ForbiddenException('Solo puedes consultar tus propias asignaturas');
        }
        return this.subjectService.findAllByIdTeacher(idTeacher);
    }
}
