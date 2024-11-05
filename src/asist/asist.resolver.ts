import { Mutation, Query, Resolver, Args } from "@nestjs/graphql";
import { AsistService } from "./asist.service";
import { CreateAsistDto } from "./dto/create-asist.dto";
import { UserWithAttendanceDto } from "./dto/user-with-attendance.dto";

@Resolver()
export class AsistResolver {

    constructor (private readonly asistService : AsistService){}

    @Mutation(() => Boolean, { description: 'Marca la asistencia de los estudiantes' })
    async takeAsist(@Args('createAsistInput') createAsistDto: CreateAsistDto,): Promise<boolean> {
        await this.asistService.addAsistencias(createAsistDto);
        return true;
    }

    @Query(() => [UserWithAttendanceDto], { description: 'Obtiene los usuarios y su asistencia por asignatura' })
    async listUsersBySubject(@Args('idSubject') idSubject: number): Promise<UserWithAttendanceDto[]> {
        return this.asistService.listUsersBySubject(idSubject);
    }

}