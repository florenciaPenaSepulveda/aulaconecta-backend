import { Resolver, Args, Mutation, Query, Context } from '@nestjs/graphql';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Resolver()
// Define el resolver de GraphQL para la entidad de usuario
export class UserResolver {

    // Inyecta el servicio UserService para manejar la lógica relacionada con los usuarios
    constructor(private readonly userService: UserService) {}

    // Mutation para crear un nuevo usuario (estudiante o profesor)
    @Mutation(() => UserEntity, { description: 'Create a new user (either student or teacher)' })
    async createUser(@Args('createUserDto') createUserDto: CreateUserDto): Promise<UserEntity> {
        // Llama al servicio de usuarios para crear un nuevo usuario
        return this.userService.addNewUser(createUserDto);
    }

    // Mutation para eliminar un usuario dado su RUT
    @Mutation(() => Boolean)
    async removeUser(@Args('rut') rut: string): Promise<boolean> {
        // Llama al servicio de usuarios para eliminar el usuario con el RUT especificado
        return this.userService.deleteUser(rut);
    }

    // Mutation para actualizar un usuario dado su RUT
    @Mutation(() => UserEntity, { description: 'Actualiza un usuario' })
    async updateUser(
        @Args('rut') rut: string,
        @Args('updateUserDto') updateUserDto: UpdateUserDto,
    ): Promise<UserEntity> {
        // Llama al servicio de usuarios para actualizar la información del usuario
        return this.userService.updateUser(rut, updateUserDto);
    }

    // Query para buscar un usuario por su RUT
    @Query(() => UserEntity, { description: 'Busca un usuario por RUT' })
    async findByRut(@Args('rut') rut: string): Promise<UserEntity> {
        // Llama al servicio de usuarios para buscar al usuario por RUT
        return this.userService.findByRut(rut);
    }

    // Query para obtener todos los usuarios
    @Query(() => [UserEntity])
    async getAllUser() {
        // Llama al servicio de usuarios para obtener una lista de todos los usuarios
        return this.userService.getAllUser();
    }

    // Query para obtener todos los usuarios que tienen el rol de estudiante
    @Query(() => [UserEntity], { description: 'Obtiene todos los usuarios con rol de student' })
    async getAllStudents(): Promise<UserEntity[]> {
        // Llama al servicio de usuarios para obtener todos los usuarios con rol de estudiante
        return this.userService.getAllStudents();
    }
}
