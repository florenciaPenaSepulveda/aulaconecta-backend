import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradesResolver } from './grades.resolver';
import { GradeEntity } from './entities/grade.entity';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([GradeEntity])],
  providers: [GradesService, GradesResolver],
  exports: [GradesService],
})
export class GradesModule {}
