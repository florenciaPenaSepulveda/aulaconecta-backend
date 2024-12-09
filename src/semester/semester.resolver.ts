import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { CreateSemesterDto } from './dto/semester.dto';
import { SemesterService } from './semester.service';

@Resolver()
export class SemesterResolver{
    constructor (private readonly semesterService: SemesterService){}

    @Mutation(() => Boolean)
    async createSemester(@Args('createSemesterDto') createSemesterDto: CreateSemesterDto): Promise<boolean>{
        return this.semesterService.addNewSemester(createSemesterDto);
    }
}