import { Module } from "@nestjs/common";
import { TypeOrmModule} from "@nestjs/typeorm";
import { CourseEntity } from "./entity/course.entity";
import { CourseResolver } from "./course.resolver";
import { CourseService } from "./course.service";

@Module({
    imports:[TypeOrmModule.forFeature([CourseEntity])],
    providers: [CourseResolver, CourseService],
    exports: [CourseService],
})

export class CourseModule{}