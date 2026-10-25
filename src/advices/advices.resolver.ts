import { Resolver, Mutation, Args, Query, Int } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AdvicesService } from "./advices.service";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";
import { NoticeResponse } from "./entities/noticeResponse.entity";
import { Guard } from "src/guard/guard";
import { CurrentUser } from "src/guard/current-user.decorator";
import { UserService } from "src/user/user.service";
import { UserRoles } from "src/user/enums/user-roles.enums";

@Resolver(() => NoticeEntity)
@UseGuards(Guard)
export class AdvicesResolver {
    constructor(
        private readonly advicesService: AdvicesService,
        private readonly userService: UserService,
    ) {}

    @Mutation(() => NoticeResponse)
    async createNotice(
        @CurrentUser() current: { id: number },
        @Args() notificationDto: NoticeDto,
    ): Promise<NoticeResponse> {
        await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.advicesService.createNotice(notificationDto);
    }

    @Mutation(() => Boolean)
    async deleteNotice(
        @CurrentUser() current: { id: number },
        @Args('id', { type: () => Int }) id: number,
    ): Promise<boolean> {
        await this.userService.assertRole(current.id, [UserRoles.Teacher, UserRoles.Admin]);
        return this.advicesService.deleteNotice(id);
    }

    @Query(() => [NoticeEntity])
    async getAllNotices(): Promise<NoticeEntity[]> {
        return this.advicesService.getAllNotices();
    }
}
