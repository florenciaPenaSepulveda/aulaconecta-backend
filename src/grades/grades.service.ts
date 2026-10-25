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

   async findGradesBySubjectId(subjectId: number): Promise<GradeEntity[]> {
    return await this.gradeRepository.find({ where: { subjectId } });
  }

  async updateGrade(id: number, updateGradeDto: UpdateGradeDto): Promise<GradeEntity> {
    const grade = await this.gradeRepository.findOne({ where: { id } });

    if (!grade) {
      throw new Error(`Grade with id ${id} not found`);
    }

    Object.assign(grade, updateGradeDto);

    return await this.gradeRepository.save(grade);
  }

  async deleteGrade(id: number): Promise<boolean> {
    const grade = await this.gradeRepository.findOne({ where: { id } });

    if (!grade) {
      throw new Error(`Grade with id ${id} not found`);
    }

    await this.gradeRepository.delete(id);
    return true;
  }

  async getAllGrades(): Promise<GradeEntity[]> {
    return await this.gradeRepository.find();
  }

  async findGradesByStudentAndSubject(
    studentId: number,
    subjectId: number,
  ): Promise<GradeEntity[]> {
    return await this.gradeRepository.find({
      where: { studentId, subjectId },
    });
  }

  async calculateAverageGradeForStudentInSubject(
    studentId: number,
    subjectId: number,
  ): Promise<number> {
    const grades = await this.gradeRepository.find({
      where: { studentId, subjectId },
    });

    if (grades.length === 0) {
      return 0;
    }

    const total = grades.reduce((sum, grade) => sum + Number(grade.grade), 0);
    const average = total / grades.length;

    return average;
  }
  

}
