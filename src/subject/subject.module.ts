import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { SubjectResolver } from "./subject.resolver";
import { SubjectService } from "./subject.service";
import { CourseEntity } from "src/course/entity/course.entity";
import { UserModule } from "src/user/user.module";

@Module({
    imports : [ TypeOrmModule.forFeature([ SubjectEntity, CourseEntity ]), UserModule ],
    providers: [SubjectService, SubjectResolver],
    exports: [SubjectService],
})

export class SubjectModule{}