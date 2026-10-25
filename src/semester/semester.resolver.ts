import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CreateSemesterDto } from './dto/semester.dto';
import { UpdateSemesterDto } from './dto/updateSemester.dto';
import { DeleteSemesterDto } from './dto/deleteSemester.dto';
import { SemesterService } from './semester.service';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';
import { UserService } from 'src/user/user.service';
import { UserRoles } from 'src/user/enums/user-roles.enums';

@Resolver()
@UseGuards(Guard)
export class SemesterResolver {
    constructor(
        private readonly semesterService: SemesterService,
        private readonly userService: UserService,
    ) {}

    @Mutation(() => Boolean)
    async createSemester(
        @CurrentUser() current: { id: number },
        @Args('createSemesterDto') createSemesterDto: CreateSemesterDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.semesterService.addNewSemester(createSemesterDto);
    }

    @Mutation(() => Boolean)
    async deleteSemester(
        @CurrentUser() current: { id: number },
        @Args('deleteSemesterDto') deleteSemesterDto: DeleteSemesterDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.semesterService.deleteSemester(deleteSemesterDto);
    }

    @Mutation(() => Boolean)
    async updateSemester(
        @CurrentUser() current: { id: number },
        @Args('updateSemesterDto') updateSemesterDto: UpdateSemesterDto,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Admin]);
        return this.semesterService.updateSemester(updateSemesterDto);
    }
}
