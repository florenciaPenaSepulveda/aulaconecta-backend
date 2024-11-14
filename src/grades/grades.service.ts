import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeEntity } from './entities/grade.entity';
import { CreateGradeDto } from './dto/createGrade.dto';
import { UpdateGradeDto } from './dto/updateGrade.dto';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(GradeEntity)
    private gradeRepository: Repository<GradeEntity>,
  ) {}

  async createGrade(createGradeDto: CreateGradeDto): Promise<GradeEntity> {
    const grade = this.gradeRepository.create(createGradeDto);
    return await this.gradeRepository.save(grade);
  }

  async findGradeById(id: number): Promise<GradeEntity | undefined> {
    return await this.gradeRepository.findOne({ where: { id } });
  }

  async findGradesByStudentId(studentId: number): Promise<GradeEntity[]> {
    return await this.gradeRepository.find({ where: { studentId } });
  }

   // Nuevo método para obtener las notas por subjectId
   async findGradesBySubjectId(subjectId: number): Promise<GradeEntity[]> {
    return await this.gradeRepository.find({ where: { subjectId } });
  }

  // Método para actualizar una nota
  async updateGrade(id: number, updateGradeDto: UpdateGradeDto): Promise<GradeEntity> {
    const grade = await this.gradeRepository.findOne({ where: { id } });

    if (!grade) {
      throw new Error(`Grade with id ${id} not found`);
    }

    // Actualizar las propiedades de la calificación
    Object.assign(grade, updateGradeDto);

    return await this.gradeRepository.save(grade);
  }

  // Método para eliminar una calificación
  async deleteGrade(id: number): Promise<boolean> {
    const grade = await this.gradeRepository.findOne({ where: { id } });

    if (!grade) {
      throw new Error(`Grade with id ${id} not found`);
    }

    await this.gradeRepository.delete(id);
    return true; // Retorna un booleano indicando que se eliminó exitosamente
  }

  async getAllGrades(): Promise<GradeEntity[]> {
    return await this.gradeRepository.find(); // Devuelve todas las calificaciones
  }

  // Nueva función para obtener todas las notas de un alumno en un subject específico
  async findGradesByStudentAndSubject(
    studentId: number,
    subjectId: number,
  ): Promise<GradeEntity[]> {
    return await this.gradeRepository.find({
      where: { studentId, subjectId },
    });
  }

  // Nueva función para calcular el promedio de un alumno en una asignatura específica
  async calculateAverageGradeForStudentInSubject(
    studentId: number,
    subjectId: number,
  ): Promise<number> {
    const grades = await this.gradeRepository.find({
      where: { studentId, subjectId },
    });

    if (grades.length === 0) {
      return 0; // o puedes lanzar un error si no hay notas para ese estudiante y asignatura
    }

    const total = grades.reduce((sum, grade) => sum + grade.grade, 0);
    const average = total / grades.length;

    return average;
  }
  

}
