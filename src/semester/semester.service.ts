import { InjectRepository } from "@nestjs/typeorm";
import { SemesterEntity } from "./entity/semester.entity";
import { Repository} from 'typeorm';
import { BadGatewayException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { CreateSemesterDto } from "./dto/semester.dto";
import { DeleteSemesterDto } from "./dto/deleteSemester.dto";
import { UpdateSemesterDto } from "./dto/updateSemester.dto";

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

    async deleteSemester(deleteSemester: DeleteSemesterDto): Promise<boolean>{
        const existSemester = await this.semesterRepository.findOne({where: { nameSemester: deleteSemester.nameSemester}});
        if(!existSemester){
            throw new NotFoundException('Semestre no existe!');
        }
        await this.semesterRepository.delete(existSemester);
        return true;
    }

    async updateSemester(updateSemesterDto: UpdateSemesterDto): Promise<boolean> {
        const existSemester = await this.semesterRepository.findOne({ where: { nameSemester: updateSemesterDto.nameSemester } });

        if (!existSemester) {
            throw new NotFoundException('El semestre no existe!');
        }

        const updateData: Partial<SemesterEntity> = {};

        if (updateSemesterDto.newNameSemester) {
            updateData.nameSemester = updateSemesterDto.newNameSemester;
        }

        if (updateSemesterDto.startDate) {
            updateData.startDate = updateSemesterDto.startDate;
        }

        if (updateSemesterDto.endDate) {
            updateData.endDate = updateSemesterDto.endDate;
        }

        if (updateSemesterDto.deadline) {
            updateData.deadline = updateSemesterDto.deadline;
        }

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No hay cambios para actualizar');
        }

        await this.semesterRepository.update({ id: existSemester.id }, updateData);

        return true;
    }

}