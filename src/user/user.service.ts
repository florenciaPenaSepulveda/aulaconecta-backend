import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from "@nestjs/common";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { UserRoles } from "./enums/user-roles.enums";
import { AuthEntity } from "src/auth/entity/auth.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,

        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) { }

    async addNewUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { role, password, ...userData } = createUserDto;

        if (!role) {
            throw new BadRequestException('El campo role es obligatorio');
        }

        const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });
        if (existingUser) {
            throw new BadRequestException('El correo electrónico ya está en uso');
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña aquí

        const newUser = this.userRepository.create({
            ...userData,
            password: hashedPassword, // Almacena la contraseña hasheada
            role,
        });

        const savedUser = await this.userRepository.save(newUser);

        // Puedes agregar lógica adicional aquí si es necesario, como guardar en AuthEntity

        return savedUser;
    }

    async deleteUser(rut: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }
        await this.userRepository.remove(user);
        return true;
    }

    async updateUser(rut: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });

        if (!user) {
            throw new BadRequestException(`Usuario con rut ${rut} no encontrado`);
        }

        // Actualiza los campos según el DTO
        Object.assign(user, updateUserDto);

        return await this.userRepository.save(user);
    }

    async findByRut(rut: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { rut } });
        if (!user) {
            throw new BadRequestException(`Usuario con RUT ${rut} no encontrado`);
        }
        return user;
    }

    async findUserById(id: number): Promise<UserEntity> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'firstName', 'lastName', 'rut', 'email', 'role'],
        });

        if (!user) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }

        return user;
    }

    async findOneByEmail(email: string) {
        return await this.userRepository.findOne({ where: { email } });
    }

    async getAllUser(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async getAllStudents(): Promise<UserEntity[]> {
        return await this.userRepository.find({
            where: { role: UserRoles.Student },
        });
    }

    async updatePassword(userId: number, newPassword: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }

        user.password = await bcrypt.hash(newPassword, 10); // Hashea la nueva contraseña
        return await this.userRepository.save(user);
    }

}
