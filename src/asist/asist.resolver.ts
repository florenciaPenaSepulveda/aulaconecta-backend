import { Mutation, Query, Resolver, Args, Int } from "@nestjs/graphql";
import { ForbiddenException, UseGuards } from "@nestjs/common";
import { AsistService } from "./asist.service";
import { CreateAsistDto } from "./dto/create-asist.dto";
import { UserWithAttendanceDto } from "./dto/user-with-attendance.dto";
import { StudentAttendanceDto } from "./dto/student-attendance.dto";
import { CourseAttendanceSummary, SubjectAttendanceSummary } from "./dto/attendance-summary.dto";
import { SubjectAttendanceCalendar } from "./dto/attendance-calendar.dto";
import { Guard } from "src/guard/guard";
import { CurrentUser } from "src/guard/current-user.decorator";
import { UserService } from "src/user/user.service";
import { SubjectService } from "src/subject/subject.service";
import { UserRoles } from "src/user/enums/user-roles.enums";

@Resolver()
@UseGuards(Guard)
export class AsistResolver {
    constructor(
        private readonly asistService: AsistService,
        private readonly userService: UserService,
        private readonly subjectService: SubjectService,
    ) {}

    @Mutation(() => Boolean, { description: 'Marca la asistencia de los estudiantes' })
    async takeAsist(
        @CurrentUser() current: { id: number },
        @Args('createAsistInput') createAsistDto: CreateAsistDto,
    ): Promise<boolean> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        for (const idSubject of new Set(createAsistDto.asistencias.map((item) => item.idSubject))) {
            await this.subjectService.assertCanManage(actor, idSubject);
        }
        await this.asistService.addAsistencias(createAsistDto);
        return true;
    }

    @Mutation(() => Boolean, { description: 'Inscribe un estudiante en una asignatura' })
    async enrollStudent(
        @CurrentUser() current: { id: number },
        @Args('idUser', { type: () => Int }) idUser: number,
        @Args('idSubject', { type: () => Int }) idSubject: number,
    ): Promise<boolean> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, idSubject);
        return this.asistService.enrollStudent(idUser, idSubject);
    }

    @Mutation(() => Boolean, { description: 'Quita un estudiante de una asignatura' })
    async unenrollStudent(
        @CurrentUser() current: { id: number },
        @Args('idUser', { type: () => Int }) idUser: number,
        @Args('idSubject', { type: () => Int }) idSubject: number,
    ): Promise<boolean> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, idSubject);
        return this.asistService.unenrollStudent(idUser, idSubject);
    }

    @Query(() => [UserWithAttendanceDto], { description: 'Obtiene los usuarios y su asistencia por asignatura' })
    async listUsersBySubject(
        @CurrentUser() current: { id: number },
        @Args('idSubject') idSubject: number,
    ): Promise<UserWithAttendanceDto[]> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, idSubject);
        return this.asistService.listUsersBySubject(idSubject);
    }

    @Query(() => [StudentAttendanceDto], { description: 'Asistencia de un estudiante por asignatura' })
    async attendanceByStudent(
        @CurrentUser() current: { id: number },
        @Args('studentId', { type: () => Int }) studentId: number,
    ): Promise<StudentAttendanceDto[]> {
        const actor = await this.userService.assertRole(current.id, [
            UserRoles.Teacher,
            UserRoles.Admin,
            UserRoles.Parents,
        ]);
        if (actor.role === UserRoles.Parents) {
            const children = await this.userService.getChildren(actor.id);
            if (!children.some(child => child.id === studentId)) {
                throw new ForbiddenException('Este estudiante no está a tu cargo');
            }
        }
        return this.asistService.attendanceByStudent(studentId);
    }

    @Query(() => SubjectAttendanceSummary, { description: 'Resumen global de asistencia de una asignatura' })
    async subjectAttendanceSummary(
        @CurrentUser() current: { id: number },
        @Args('subjectId', { type: () => Int }) subjectId: number,
    ): Promise<SubjectAttendanceSummary> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, subjectId);
        return this.asistService.subjectAttendanceSummary(subjectId);
    }

    @Query(() => [CourseAttendanceSummary], { description: 'Resumen global de asistencia de cada curso' })
    async courseAttendanceSummaries(@CurrentUser() current: { id: number }): Promise<CourseAttendanceSummary[]> {
        await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.asistService.courseAttendanceSummaries();
    }

    @Query(() => SubjectAttendanceCalendar, { description: 'Calendario de asistencia por día de una asignatura' })
    async subjectAttendanceCalendar(
        @CurrentUser() current: { id: number },
        @Args('subjectId', { type: () => Int }) subjectId: number,
    ): Promise<SubjectAttendanceCalendar> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        await this.subjectService.assertCanManage(actor, subjectId);
        return this.asistService.subjectAttendanceCalendar(subjectId);
    }
}
