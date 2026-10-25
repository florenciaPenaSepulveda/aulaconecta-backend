import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsistEntity } from "./entities/asist.entity";
import { AttendanceRecordEntity } from "./entities/attendance-record.entity";
import { AsistResolver } from "./asist.resolver";
import { AsistService } from "./asist.service";
import { UserModule } from "src/user/user.module";
import { SubjectModule } from "src/subject/subject.module";
import { SubjectEntity } from "src/subject/entities/subject.entity";
import { CourseEntity } from "src/course/entity/course.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([AsistEntity, AttendanceRecordEntity, SubjectEntity, CourseEntity]),
        UserModule,
        SubjectModule,
    ],
    providers: [AsistResolver, AsistService],
})
export class AsistModule {}
