import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRoles } from './enums/user-roles.enums';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @UseGuards(Guard)
    @Mutation(() => UserEntity, { description: 'Crea un usuario. Los profesores solo pueden crear estudiantes.' })
    async createUser(
        @CurrentUser() current: { id: number },
        @Args('createUserDto') createUserDto: CreateUserDto,
    ): Promise<UserEntity> {
        const actor = await this.userService.assertRole(current.id, [UserRoles.Admin, UserRoles.Teacher]);
        if (actor.role === UserRoles.Teacher && createUserDto.role !== UserRoles.Student) {
            throw new ForbiddenException('Solo un administrador puede crear usuarios con este rol');
        }
        return this.userService.addNewUser(createUserDto);
    }

    @UseGuards(Guard)
    @Mutation(() => Boolean)
    async removeUser(
        @CurrentUser() current: { id: number },
        @Args('rut') rut: string,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin, UserRoles.Teacher]);
        return this.userService.deleteUser(rut);
    }

    @UseGuards(Guard)
    @Mutation(() => UserEntity, { description: 'Actualiza un usuario' })
    async updateUser(
        @CurrentUser() current: { id: number },
        @Args('rut') rut: string,
        @Args('updateUserDto') updateUserDto: UpdateUserDto,
    ): Promise<UserEntity> {
        await this.userService.assertRole(current.id, [UserRoles.Admin, UserRoles.Teacher]);
        return this.userService.updateUser(rut, updateUserDto);
    }

    @UseGuards(Guard)
    @Query(() => UserEntity, { description: 'Busca un usuario por RUT' })
    async findByRut(@Args('rut') rut: string): Promise<UserEntity> {
        return this.userService.findByRut(rut);
    }

    @UseGuards(Guard)
    @Query(() => [UserEntity])
    async getAllUser() {
        return this.userService.getAllUser();
    }

    @UseGuards(Guard)
    @Query(() => [UserEntity], { description: 'Obtiene todos los usuarios con rol de student' })
    async getAllStudents(): Promise<UserEntity[]> {
        return this.userService.getAllStudents();
    }

    @UseGuards(Guard)
    @Query(() => [UserEntity], { description: 'Obtiene todos los apoderados' })
    async getAllParents(): Promise<UserEntity[]> {
        return this.userService.getAllParents();
    }

    @UseGuards(Guard)
    @Query(() => [UserEntity], { description: 'Pupilos del apoderado autenticado' })
    async myChildren(@CurrentUser() current: { id: number }): Promise<UserEntity[]> {
        return this.userService.getChildren(current.id);
    }
}
