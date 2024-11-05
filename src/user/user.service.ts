import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { UserEntity } from "./entity/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from 'bcryptjs';
import { UserRoles } from "./enums/user-roles.enums";
import { AuthEntity } from "src/auth/entity/auth.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
// Define el servicio de usuarios, responsable de manejar la lógica de negocio relacionada con los usuarios
export class UserService {

    constructor(
        // Inyecta el repositorio de UserEntity para interactuar con la base de datos de usuarios
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,

        // Inyecta el repositorio de AuthEntity para interactuar con las credenciales de autenticación
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    // Método para agregar un nuevo usuario
    async addNewUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { role, password, ...userData } = createUserDto;
        
        // Verifica si se proporciona un rol, de lo contrario lanza una excepción
        if (!role) {
            throw new BadRequestException('El campo role es obligatorio');
        }
        
        // Crea una nueva instancia de usuario con los datos proporcionados
        const newUser = this.userRepository.create({
            ...userData,
            role,
        });
        // Guarda el nuevo usuario en la base de datos
        const savedUser = await this.userRepository.save(newUser);
        
        // Si el rol es Teacher, Admin o Parents, maneja la creación de credenciales de autenticación
        if (role === UserRoles.Teacher || role === UserRoles.Admin || role === UserRoles.Parents) {
            // Verifica si se proporciona una contraseña, de lo contrario lanza una excepción
            if (!password) {
                throw new BadRequestException('Se requiere una contraseña para roles Teacher o Admin');
            }
            // Hashea la contraseña proporcionada
            const hashedPassword = await bcrypt.hash(password, 10);
            // Crea una nueva instancia de AuthEntity para almacenar las credenciales
            const authEntity = this.authRepository.create({
                idUser: savedUser.id,
                password: hashedPassword,
            });
            // Guarda las credenciales en la base de datos
            await this.authRepository.save(authEntity);
        }
        
        // Devuelve el usuario guardado
        return savedUser;
    }

    // Método para eliminar un usuario dado su RUT
    async deleteUser(rut: string): Promise<boolean> {
        // Busca al usuario por su RUT
        const user = await this.userRepository.findOne({ where: { rut } });
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new BadRequestException('Usuario no encontrado');
        }
        // Elimina al usuario de la base de datos
        await this.userRepository.remove(user);
        // Devuelve true si la eliminación fue exitosa
        return true;
    }

    // Método para actualizar la información de un usuario dado su RUT
    async updateUser(rut: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        // Busca al usuario por su RUT
        const user = await this.userRepository.findOne({ where: { rut } });
        
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new BadRequestException(`Usuario con rut ${rut} no encontrado`);
        }

        // Actualiza la información del usuario si se proporcionan nuevos datos
        if (updateUserDto.firstName) {
            user.firstName = updateUserDto.firstName;
        }
        if (updateUserDto.lastName) {
            user.lastName = updateUserDto.lastName;
        }
        if (updateUserDto.email) {
            user.email = updateUserDto.email;
        }

        // Guarda los cambios en la base de datos y devuelve el usuario actualizado
        return await this.userRepository.save(user);
    }

    // Método para buscar un usuario por su RUT
    async findByRut(rut: string): Promise<UserEntity> {
        // Busca al usuario por su RUT
        const user = await this.userRepository.findOne({ where: { rut } });
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new BadRequestException(`Usuario con RUT ${rut} no encontrado`);
        }
        // Devuelve el usuario encontrado
        return user;
    }

    // Método para buscar un usuario por su ID
    async findUserById(id: number): Promise<UserEntity> {
        // Busca al usuario por su ID y selecciona solo los campos relevantes
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'firstName', 'lastName', 'rut', 'email', 'role'],
        });
        
        // Si el usuario no existe, lanza una excepción
        if (!user) {
            throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        }

        // Devuelve el usuario encontrado
        return user;
    }

    // Método para buscar un usuario por su email
    async findOneByEmail(email: string) {
        // Busca y devuelve el usuario que coincide con el email proporcionado
        return await this.userRepository.findOneBy({ email });
    }

    // Método para obtener todos los usuarios
    async getAllUser(): Promise<UserEntity[]> {
        // Devuelve una lista de todos los usuarios en la base de datos
        return await this.userRepository.find();
    }

    // Método para obtener todos los usuarios con el rol de estudiante
    async getAllStudents(): Promise<UserEntity[]> {
        // Devuelve una lista de todos los usuarios cuyo rol es 'Student'
        return await this.userRepository.find({
            where: { role: UserRoles.Student },
        });
    }

    // Método para actualizar la contraseña de un usuario dado su ID
    async updatePassword(id: number, newPassword: string): Promise<void> {
        // Actualiza la contraseña del usuario en el repositorio de autenticación
        await this.authRepository.update(id, { password: newPassword });
    }

    async updateChangePass(id: number, newIsChangePass: boolean): Promise<void>{
        await this.authRepository.update(id, {isChangePass: newIsChangePass});
    }
}
