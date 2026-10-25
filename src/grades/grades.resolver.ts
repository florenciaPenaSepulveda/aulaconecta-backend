import { Resolver, Mutation, Args, Query, Float } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradeEntity } from './entities/grade.entity';
import { CreateGradeDto } from './dto/createGrade.dto';
import { UpdateGradeDto } from './dto/updateGrade.dto';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';
import { UserService } from 'src/user/user.service';
import { SubjectService } from 'src/subject/subject.service';
import { UserRoles } from 'src/user/enums/user-roles.enums';

@Resolver(() => GradeEntity)
@UseGuards(Guard)
export class GradesResolver {
  constructor(
    private readonly gradesService: GradesService,
    private readonly userService: UserService,
    private readonly subjectService: SubjectService,
  ) {}

  private async assertCanManageSubject(userId: number, subjectId: number): Promise<void> {
    const actor = await this.userService.assertRole(userId, [UserRoles.Teacher, UserRoles.Admin]);
    await this.subjectService.assertCanManage(actor, subjectId);
  }

  private async assertCanRead(userId: number, studentId: number): Promise<void> {
    const actor = await this.userService.assertRole(userId, [
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
  }

  @Mutation(() => GradeEntity, { name: 'createGrade' })
  async createGrade(
    @CurrentUser() current: { id: number },
    @Args('createGradeDto') createGradeDto: CreateGradeDto,
  ): Promise<GradeEntity> {
    await this.assertCanManageSubject(current.id, createGradeDto.subjectId);
    return await this.gradesService.createGrade(createGradeDto);
  }

  @Query(() => [GradeEntity], { name: 'gradesByStudentId' })
  async gradesByStudentId(
    @CurrentUser() current: { id: number },
    @Args('studentId') studentId: number,
  ): Promise<GradeEntity[]> {
    await this.assertCanRead(current.id, studentId);
    return await this.gradesService.findGradesByStudentId(studentId);
  }

  @Query(() => [GradeEntity], { name: 'gradesBySubjectId' })
  async gradesBySubjectId(
    @CurrentUser() current: { id: number },
    @Args('subjectId') subjectId: number,
  ): Promise<GradeEntity[]> {
    await this.assertCanManageSubject(current.id, subjectId);
    return await this.gradesService.findGradesBySubjectId(subjectId);
  }

  @Mutation(() => GradeEntity, { name: 'updateGrade' })
  async updateGrade(
    @CurrentUser() current: { id: number },
    @Args('id') id: number,
    @Args('updateGradeDto') updateGradeDto: UpdateGradeDto,
  ): Promise<GradeEntity> {
    const actual = await this.gradesService.findGradeById(id);
    await this.assertCanManageSubject(current.id, actual ? actual.subjectId : 0);
    if (updateGradeDto.subjectId !== undefined) {
      await this.assertCanManageSubject(current.id, updateGradeDto.subjectId);
    }
    return await this.gradesService.updateGrade(id, updateGradeDto);
  }

  @Mutation(() => Boolean, { name: 'deleteGrade' })
  async deleteGrade(
    @CurrentUser() current: { id: number },
    @Args('id') id: number,
  ): Promise<boolean> {
    const actual = await this.gradesService.findGradeById(id);
    await this.assertCanManageSubject(current.id, actual ? actual.subjectId : 0);
    return await this.gradesService.deleteGrade(id);
  }

  @Query(() => GradeEntity, { name: 'findGradeById' })
  async findGradeById(
    @CurrentUser() current: { id: number },
    @Args('id') id: number,
  ): Promise<GradeEntity | undefined> {
    const grade = await this.gradesService.findGradeById(id);
    await this.assertCanManageSubject(current.id, grade ? grade.subjectId : 0);
    return grade;
  }

  @Query(() => [GradeEntity], { name: 'getAllGrades' })
  async getAllGrades(@CurrentUser() current: { id: number }): Promise<GradeEntity[]> {
    await this.userService.assertRole(current.id, [UserRoles.Admin]);
    return await this.gradesService.getAllGrades();
  }

  @Query(() => [GradeEntity], { name: 'gradesByStudentAndSubject' })
  async gradesByStudentAndSubject(
    @CurrentUser() current: { id: number },
    @Args('studentId') studentId: number,
    @Args('subjectId') subjectId: number,
  ): Promise<GradeEntity[]> {
    await this.assertCanRead(current.id, studentId);
    return await this.gradesService.findGradesByStudentAndSubject(studentId, subjectId);
  }

  @Query(() => Float, { name: 'averageGradeByStudentAndSubject' })
  async averageGradeByStudentAndSubject(
    @CurrentUser() current: { id: number },
    @Args('studentId') studentId: number,
    @Args('subjectId') subjectId: number,
  ): Promise<number> {
    await this.assertCanRead(current.id, studentId);
    return await this.gradesService.calculateAverageGradeForStudentInSubject(studentId, subjectId);
  }
}
