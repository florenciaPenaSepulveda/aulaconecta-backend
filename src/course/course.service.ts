import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCourseDto } from "./dto/course.dto";
import { CourseEntity } from "./entity/course.entity";
import { Repository} from 'typeorm';
import { DeleteCourseDto } from "./dto/deleteCourse.dto";
import { UpdateCourseDto } from "./dto/updateCourse.dto";

@Injectable()
export class CourseService{

    constructor(
        @InjectRepository(CourseEntity)
        private readonly courseRepository: Repository<CourseEntity>,
    ){}

    async addNewCourse(createCourseDto: CreateCourseDto): Promise<boolean>{
        const existCourseByName = await this.courseRepository.findOne({where: {nameCourse: createCourseDto.nameCourse, level: createCourseDto.level}});
        if(existCourseByName) {
            throw new BadRequestException('El curso ya esta creado!');
        }
        const newCourse = await this.courseRepository.create(createCourseDto);
        await this.courseRepository.save(newCourse);
        return true;
    }

    async deleteCourse (deleteCourse: DeleteCourseDto): Promise<boolean>{
        const existCourse = await this.courseRepository.findOne({where: {nameCourse: deleteCourse.nameCourse, level: deleteCourse.level}});
        if(!existCourse){
            throw new BadRequestException('El curso no existe!')
        }
        await this.courseRepository.delete(existCourse);
        return true;
    }

    async updateCourse(updateCourse: UpdateCourseDto): Promise<boolean>{
        const existCourse = await this.courseRepository.findOne({
            where: { nameCourse: updateCourse.nameCourse, level: updateCourse.level }
        });

        if (!existCourse) {
            throw new NotFoundException('El curso no existe!');
        }
        
        const updateData: Partial<CourseEntity> = {};

        if (updateCourse.newName) {
            updateData.nameCourse = updateCourse.newName;
        }

        if (updateCourse.newLevel) {
            updateData.level = updateCourse.newLevel;
        }

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No hay cambios para actualizar');
        }

        await this.courseRepository.update({ id: existCourse.id }, updateData);
        return true;
    }
}