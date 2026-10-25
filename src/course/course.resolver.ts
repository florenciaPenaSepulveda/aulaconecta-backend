import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CourseEntity } from './entity/course.entity';
import { CreateCourseDto } from './dto/course.dto';
import { CourseService } from './course.service';
import { DeleteCourseDto } from './dto/deleteCourse.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';
import { UserService } from 'src/user/user.service';
import { UserRoles } from 'src/user/enums/user-roles.enums';

@Resolver()
@UseGuards(Guard)
export class CourseResolver {
    constructor(
        private readonly courseService: CourseService,
        private readonly userService: UserService,
    ) {}

    @Query(() => [CourseEntity])
    async listCourses(@CurrentUser() current: { id: number }): Promise<CourseEntity[]> {
        await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.courseService.findAll();
    }

    @Mutation(() => Boolean)
    async createCourse(
        @CurrentUser() current: { id: number },
        @Args('createCourseDto') createCourseDto: CreateCourseDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.courseService.addNewCourse(createCourseDto);
    }

    @Mutation(() => Boolean)
    async deleteCourseDto(
        @CurrentUser() current: { id: number },
        @Args('deleteCourseDto') deleteCourseDto: DeleteCourseDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.courseService.deleteCourse(deleteCourseDto);
    }

    @Mutation(() => Boolean)
    async updateCourseDto(
        @CurrentUser() current: { id: number },
        @Args('updateCourseDto') updateCourseDto: UpdateCourseDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.courseService.updateCourse(updateCourseDto);
    }
}
