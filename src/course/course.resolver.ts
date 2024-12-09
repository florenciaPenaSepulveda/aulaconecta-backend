import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { CourseEntity } from './entity/course.entity';
import { CreateCourseDto } from './dto/course.dto';
import { CourseService } from './course.service';
import { DeleteCourseDto } from './dto/deleteCourse.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';

@Resolver()
export class CourseResolver{

    constructor (private readonly courseService: CourseService){}

    @Mutation(() => Boolean)
    async createCourse(@Args('createCourseDto') createCourseDto: CreateCourseDto): Promise<boolean>{
        return this.courseService.addNewCourse(createCourseDto);
    }

    @Mutation(() => Boolean)
    async deleteCourseDto(@Args('deleteCourseDto') deleteCourseDto: DeleteCourseDto): Promise<boolean>{
        return this.courseService.deleteCourse(deleteCourseDto);
    }

    @Mutation(() => Boolean)
    async updateCourseDto(@Args('updateCourseDto') updateCourseDto: UpdateCourseDto): Promise<boolean>{
        return this.courseService.updateCourse(updateCourseDto);
    }
}