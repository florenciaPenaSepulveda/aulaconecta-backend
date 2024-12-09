import { InjectRepository } from "@nestjs/typeorm";
import { SemesterEntity } from "./entity/semester.entity";
import { Repository} from 'typeorm';
import { BadGatewayException, Injectable } from "@nestjs/common";
import { CreateSemesterDto } from "./dto/semester.dto";

@Injectable()
export class SemesterService{
    constructor(
        @InjectRepository(SemesterEntity)
        private readonly semesterRepository : Repository<SemesterEntity>,
    ){}

    async addNewSemester(createSemesterDto: CreateSemesterDto): Promise<boolean>{
        const existSemester = await this.semesterRepository.findOne({where: {nameSemester: createSemesterDto.nameSemester}});
        if (existSemester){
            throw new BadGatewayException('El semestre ya existe!');
        }
        const newSemester = await this.semesterRepository.create(createSemesterDto);
        await this.semesterRepository.save(newSemester);
        return true;

    }
}