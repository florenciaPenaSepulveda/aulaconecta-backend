import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectEntity } from "./entities/subject.entity";
import { SubjectResolver } from "./subject.resolver";
import { SubjectService } from "./subject.service";

@Module({
    imports : [ TypeOrmModule.forFeature([ SubjectEntity ])],
    providers: [SubjectService, SubjectResolver],
})

export class SubjectModule{}