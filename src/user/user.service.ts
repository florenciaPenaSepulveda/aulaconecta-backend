import { Injectable, UnauthorizedException, BadRequestException, NotFoundException  } from "@nestjs/common";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThan} from "typeorm";
import * as bcrypt from 'bcryptjs';
import { UserRoles } from "./enums/user-roles.enums";
import { AuthEntity } from "src/auth/entity/auth.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";



@Injectable()
export class UserService{

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository : Repository<UserEntity>,

        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ){}

    async addNewUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { role, password, ...userData } = createUserDto;
    
        if (!role) {
            throw new BadRequestException('El campo role es obligatorio');
        }
    
        const newUser = this.userRepository.create({
            ...userData,
            role, 
        });
        const savedUser = await this.userRepository.save(newUser);
    
        if ((role === UserRoles.Teacher || role === UserRoles.Admin || role === UserRoles.Parents)) {
            if (!password) {
                throw new BadRequestException('Se requiere una contraseña para roles Teacher o Admin');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const authEntity = this.authRepository.create({
                idUser: savedUser.id,
                password: hashedPassword,
            });
            await this.authRepository.save(authEntity);
        }
    
        return savedUser;
    }


    async deleteUser(rut: string): Promise<boolean> {
        const user = await this.userRepository.findOne({where: {rut}});
        if (!user){
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

        if (updateUserDto.firstName) {
            user.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
            user.lastName = updateUserDto.lastName;
        }
        if (updateUserDto.email) {
            user.email = updateUserDto.email;
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
        return await this.userRepository.findOneBy({ email });
    }

    async getAllUser(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async getAllStudents(): Promise<UserEntity[]> {
        return await this.userRepository.find({
            where: { role: UserRoles.Student },
        });
    }

    async updatePassword(id: number, newPassword: string): Promise<void> {
        await this.authRepository.update(id, { password: newPassword });
    }
}