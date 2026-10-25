import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { UserRoles } from "./enums/user-roles.enums";
import { AuthEntity } from "src/auth/entity/auth.entity";
import { AsistEntity } from "src/asist/entities/asist.entity";
import { AttendanceRecordEntity } from "src/asist/entities/attendance-record.entity";
import { GradeEntity } from "src/grades/entities/grade.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { credentialsTemplate, sendMail } from "src/mail/mail";

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    private async resolveGuardianId(guardianRut?: string): Promise<number | null> {
        if (!guardianRut) {
            return null;
        }
        const guardian = await this.userRepository.findOne({ where: { rut: guardianRut } });
        if (!guardian || guardian.role !== UserRoles.Parents) {
            throw new BadRequestException(`No existe un apoderado con RUT ${guardianRut}.`);
        }
        return guardian.id;
    }

    async addNewUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { role, password, guardianRut, ...userData } = createUserDto;
        if (!role) {
            throw new BadRequestException('El campo role es obligatorio');
        }
        const { rut, email } = createUserDto;
        if (await this.userRepository.findOne({ where: { rut } })) {
            throw new BadRequestException(`El RUT ${rut} ya está registrado en el sistema.`);
        }
        if (await this.userRepository.findOne({ where: { email } })) {
            throw new BadRequestException(`El email ${email} ya está registrado en el sistema.`);
        }
        const needsPassword = role !== UserRoles.Student;
        if (needsPassword && !password) {
            throw new BadRequestException('Se requiere una contraseña para este rol');
        }
        const guardianId = role === UserRoles.Student ? await this.resolveGuardianId(guardianRut) : null;

        const savedUser = await this.userRepository.save(
            this.userRepository.create({ ...userData, role, guardianId }),
        );

        if (needsPassword) {
            await this.authRepository.save(
                this.authRepository.create({
                    idUser: savedUser.id,
                    password: await bcrypt.hash(password, 10),
                    isChangePass: false,
                }),
            );
            const template = credentialsTemplate(email, password);
            await sendMail(email, template.subject, template.text, template.html).catch(() => false);
        }
        return savedUser;
    }

    async deleteUser(rut: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }
        const manager = this.userRepository.manager;
        await this.authRepository.delete({ idUser: user.id });
        await manager.delete(AsistEntity, { idUser: user.id });
        await manager.delete(AttendanceRecordEntity, { idUser: user.id });
        await manager.delete(GradeEntity, { studentId: user.id });
        await this.userRepository.update({ guardianId: user.id }, { guardianId: null });
        await this.userRepository.remove(user);
        return true;
    }

    async updateUser(rut: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con rut ${rut} no encontrado`);
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const emailOwner = await this.userRepository.findOne({ where: { email: updateUserDto.email } });
            if (emailOwner) {
                throw new BadRequestException("El email ingresado ya esta en uso!");
            }
            user.email = updateUserDto.email;
        }
        if (updateUserDto.firstName) {
            user.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
            user.lastName = updateUserDto.lastName;
        }
        if (updateUserDto.guardianRut !== undefined && user.role === UserRoles.Student) {
            user.guardianId = await this.resolveGuardianId(updateUserDto.guardianRut || undefined);
        }
        return await this.userRepository.save(user);
    }

    async findByRut(rut: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con RUT ${rut} no encontrado`);
        }
        return user;
    }

    async getAllUser(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async getAllStudents(): Promise<UserEntity[]> {
        return await this.userRepository.find({ where: { role: UserRoles.Student } });
    }

    async getAllParents(): Promise<UserEntity[]> {
        return await this.userRepository.find({ where: { role: UserRoles.Parents } });
    }

    async getChildren(guardianId: number): Promise<UserEntity[]> {
        return await this.userRepository.find({ where: { guardianId, role: UserRoles.Student } });
    }

    async assertRole(userId: number, roles: UserRoles[]): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || !roles.includes(user.role)) {
            throw new ForbiddenException('No tienes permisos para realizar esta acción');
        }
        return user;
    }

    async updatePassword(id: number, newPassword: string): Promise<void> {
        await this.authRepository.update(id, { password: newPassword });
    }

    async updateChangePass(id: number, newIsChangePass: boolean): Promise<void> {
        await this.authRepository.update(id, { isChangePass: newIsChangePass });
    }

    async findUserById(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }
        return user;
    }

    async findUsersByIds(ids: number[]): Promise<UserEntity[]> {
        if (!ids.length) {
            return [];
        }
        return await this.userRepository.find({ where: { id: In(ids) } });
    }

    async findOneByEmail(email: string) {
        return await this.userRepository.findOneBy({ email });
    }
}
