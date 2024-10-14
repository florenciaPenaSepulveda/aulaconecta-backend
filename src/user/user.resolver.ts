import { Resolver, Args, Mutation, Query, Context} from '@nestjs/graphql';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Resolver()
export class UserResolver{

    constructor (private readonly userService : UserService){}

    @Mutation(() => UserEntity, {description: 'Create a new user (either student or teacher)'})
    async createUser(@Args('createUserDto') createUserDto: CreateUserDto): Promise<UserEntity> {
        return this.userService.addNewUser(createUserDto);
    }

    @Mutation(() => Boolean)
    async removeUser(@Args('rut') rut :string): Promise<boolean>{
        return this.userService.deleteUser(rut);
    }

    @Mutation(() => UserEntity, { description: 'Actualiza un usuario' })
    async updateUser(
        @Args('rut') rut: string,
        @Args('updateUserDto') updateUserDto: UpdateUserDto,
    ): Promise<UserEntity> {
        return this.userService.updateUser(rut, updateUserDto);
    }

    @Query(() => UserEntity, { description: 'Busca un usuario por RUT' })
    async findByRut(@Args('rut') rut: string): Promise<UserEntity> {
        return this.userService.findByRut(rut);
    }

    @Query(() => [UserEntity])
    async getAllUser(){
        return this.userService.getAllUser();
    }

    @Query(() => [UserEntity], { description: 'Obtiene todos los usuarios con rol de student' })
    async getAllStudents(): Promise<UserEntity[]> {
        return this.userService.getAllStudents();
    }
}