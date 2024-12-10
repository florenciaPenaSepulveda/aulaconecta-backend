import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { SubjectResolver } from "./subject.resolver";
import { SubjectService } from "./subject.service";
import { CourseEntity } from "src/course/entity/course.entity";

@Module({
    imports : [ TypeOrmModule.forFeature([ SubjectEntity, CourseEntity ])],
    providers: [SubjectService, SubjectResolver],
})

export class SubjectModule{}