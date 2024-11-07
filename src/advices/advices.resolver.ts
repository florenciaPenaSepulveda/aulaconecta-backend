import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { AdvicesService } from "./advices.service";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";

@Resolver(() => NoticeEntity)
export class AdvicesResolver {
    constructor(private readonly advicesService: AdvicesService) {}

    @Mutation(() => NoticeEntity)
    async createNotice( @Args() notificationDto: NoticeDto ): Promise<NoticeEntity> {
        return this.advicesService.createNotice(notificationDto);
    }

    @Query(() => [NoticeEntity])
    async getAllNotices(): Promise<NoticeEntity[]> {
        return this.advicesService.getAllNotices();
    }
}