import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";
import { NoticeResponse } from "./entities/noticeResponse.entity";

@Injectable()
export class AdvicesService {
    constructor(
        @InjectRepository(NoticeEntity)
        private readonly advicesRepository: Repository<NoticeEntity>,
    ) {}

    async createNotice(notificationDto: NoticeDto): Promise<NoticeResponse> {
        try {
            await this.advicesRepository.save(this.advicesRepository.create(notificationDto));
            return { isCreateNotice: true } as NoticeResponse;
        } catch (error) {
            return { isCreateNotice: false } as NoticeResponse;
        }
    }

    async getAllNotices(): Promise<NoticeEntity[]> {
        return await this.advicesRepository.find({ order: { createdAt: 'DESC', id: 'DESC' } });
    }

    async deleteNotice(id: number): Promise<boolean> {
        const result = await this.advicesRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
