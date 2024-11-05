import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm';
import { AsistEntity } from "./entities/asist.entity";
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAsistDto } from './dto/create-asist.dto';
import { UserService } from 'src/user/user.service';
import { UserWithAttendanceDto } from './dto/user-with-attendance.dto';

@Injectable()
export class AsistService{

    constructor(
        @InjectRepository(AsistEntity)
        private readonly asistRepository : Repository<AsistEntity>,

        private readonly userService: UserService,
    ){}

    async addAsistencias(createAsistDto: CreateAsistDto): Promise<AsistEntity[]> {
        const { asistencias } = createAsistDto;
        const updatedAsistEntities: AsistEntity[] = [];
    
        for (const asistencia of asistencias) {
            const { idUser, idSubject, asist } = asistencia;
        
        let existingAsist = await this.asistRepository.findOne({
            where: { idUser, idSubject },
        });
    
        if (existingAsist) {
            if (asist === 1) {
                existingAsist.asist += 1;
            }
            updatedAsistEntities.push(await this.asistRepository.save(existingAsist));
        } else {
            const newAsist = this.asistRepository.create(asistencia);
            updatedAsistEntities.push(await this.asistRepository.save(newAsist));
        }
        }
        return updatedAsistEntities;
    }

    async listUsersBySubject(idSubject: number): Promise<UserWithAttendanceDto[]> {
        const asistencias = await this.asistRepository.find({
            where: { idSubject },
        });
    
        if (!asistencias.length) {
            throw new NotFoundException(`No se encontraron usuarios para el subject con id ${idSubject}`);
        }
    
        const userIds = asistencias.map(asistencia => asistencia.idUser);
        
        const userWithAttendance: UserWithAttendanceDto[] = await Promise.all(
            userIds.map(async (idUser) => {
            const user = await this.userService.findUserById(idUser); 
    
            const userAsistencias = asistencias.filter(asistencia => asistencia.idUser === idUser);
            
            const totalAsist = userAsistencias.reduce((sum, asist) => sum + asist.asist, 0);
            const totalAbsences = userAsistencias.reduce((sum, asist) => sum + asist.absences, 0);
    
            return {
                user,
                totalAsist,
                totalAbsences,
            };
            })
        );
    
        return userWithAttendance;
    }

}
