import { Resolver, Args, Mutation} from '@nestjs/graphql';
import { CreateSemesterDto } from './dto/semester.dto';
import { UpdateSemesterDto } from './dto/updateSemester.dto';
import { DeleteSemesterDto } from './dto/deleteSemester.dto';
import { SemesterService } from './semester.service';


@Resolver()
export class SemesterResolver{
    constructor (private readonly semesterService: SemesterService){}

    @Mutation(() => Boolean)
    async createSemester(@Args('createSemesterDto') createSemesterDto: CreateSemesterDto): Promise<boolean>{
        return this.semesterService.addNewSemester(createSemesterDto);
    }

    @Mutation(() => Boolean)
    async deleteSemester(@Args('deleteSemesterDto') deletesemesterDto: DeleteSemesterDto): Promise<boolean>{
        return this.semesterService.deleteSemester(deletesemesterDto);
    }

    @Mutation(() => Boolean)
    async updateSemester(@Args('updateSemesterDto') updateSemesterDto: UpdateSemesterDto): Promise<boolean> {
        return this.semesterService.updateSemester(updateSemesterDto);
    }
}