import { Resolver, Mutation, Args, Query } from "@nestjs/graphql";
import { AdvicesService } from "./advices.service";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";
import { NoticeResponse } from "./entities/noticeResponse.entity";

@Resolver(() => NoticeEntity)
export class AdvicesResolver {
    constructor(private readonly advicesService: AdvicesService) {}

    @Mutation(() => NoticeResponse)
    async createNotice( @Args() notificationDto: NoticeDto ): Promise<NoticeResponse> {
        return this.advicesService.createNotice(notificationDto);
    }

    @Query(() => [NoticeEntity])
        async getAllNotices(): Promise<NoticeEntity[]> {
        console.log("getAllNotices resolver llamado");
        return this.advicesService.getAllNotices();
        }
}