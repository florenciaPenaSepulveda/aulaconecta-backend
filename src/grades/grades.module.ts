import { UserModule } from "src/user/user.module";
import { SubjectModule } from "src/subject/subject.module";
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradesResolver } from './grades.resolver';
import { GradeEntity } from './entities/grade.entity';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([GradeEntity]), UserModule, SubjectModule],
  providers: [GradesService, GradesResolver],
  exports: [GradesService],
})
export class GradesModule {}
