import { Resolver, Mutation, Args, Query, Float } from '@nestjs/graphql';
import { GradesService } from './grades.service';
import { GradeEntity } from './entities/grade.entity';
import { CreateGradeDto } from './dto/createGrade.dto';
import { UpdateGradeDto } from './dto/updateGrade.dto';

@Resolver(() => GradeEntity)
export class GradesResolver {
  constructor(private readonly gradesService: GradesService) {}

  @Mutation(() => GradeEntity, { name: 'createGrade' })
  async createGrade(
    @Args('createGradeDto') createGradeDto: CreateGradeDto,
  ): Promise<GradeEntity> {
    return await this.gradesService.createGrade(createGradeDto);
  }

  @Query(() => [GradeEntity], { name: 'gradesByStudentId' })
  async gradesByStudentId(
    @Args('studentId') studentId: number,
  ): Promise<GradeEntity[]> {
    return await this.gradesService.findGradesByStudentId(studentId);
  }

  // Nueva consulta para obtener las notas por subjectId
  @Query(() => [GradeEntity], { name: 'gradesBySubjectId' })
  async gradesBySubjectId(
    @Args('subjectId') subjectId: number,
  ): Promise<GradeEntity[]> {
    return await this.gradesService.findGradesBySubjectId(subjectId);
  }

  // Nueva mutación para actualizar una calificación
  @Mutation(() => GradeEntity, { name: 'updateGrade' })
  async updateGrade(
    @Args('id') id: number,
    @Args('updateGradeDto') updateGradeDto: UpdateGradeDto,
  ): Promise<GradeEntity> {
    return await this.gradesService.updateGrade(id, updateGradeDto);
  }

  // Mutación para eliminar una calificación
  @Mutation(() => Boolean, { name: 'deleteGrade' })
  async deleteGrade(@Args('id') id: number): Promise<boolean> {
    return await this.gradesService.deleteGrade(id);
  }

  @Query(() => GradeEntity, { name: 'findGradeById' })
  async findGradeById(@Args('id') id: number): Promise<GradeEntity | undefined> {
    return await this.gradesService.findGradeById(id); // Llamada al servicio
  }

  @Query(() => [GradeEntity], { name: 'getAllGrades' })
  async getAllGrades(): Promise<GradeEntity[]> {
    return await this.gradesService.getAllGrades(); // Llamada al servicio para obtener todas las calificaciones
  }

  // Nueva query para obtener notas de un alumno en una asignatura específica
  @Query(() => [GradeEntity], { name: 'gradesByStudentAndSubject' })
  async gradesByStudentAndSubject(
    @Args('studentId') studentId: number,
    @Args('subjectId') subjectId: number,
  ): Promise<GradeEntity[]> {
    return await this.gradesService.findGradesByStudentAndSubject(studentId, subjectId);
  }


  // Nueva query para obtener el promedio de un alumno en una asignatura específica
  @Query(() => Float, { name: 'averageGradeByStudentAndSubject' })
  async averageGradeByStudentAndSubject(
    @Args('studentId') studentId: number,
    @Args('subjectId') subjectId: number,
  ): Promise<number> {
    return await this.gradesService.calculateAverageGradeForStudentInSubject(studentId, subjectId);
  }
}

