import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { TypeOrmModule} from "@nestjs/typeorm";
import { CourseEntity } from "./entity/course.entity";
import { CourseResolver } from "./course.resolver";
import { CourseService } from "./course.service";

@Module({
    imports:[UserModule, TypeOrmModule.forFeature([CourseEntity])],
    providers: [CourseResolver, CourseService],
    exports: [CourseService],
})

export class CourseModule{}