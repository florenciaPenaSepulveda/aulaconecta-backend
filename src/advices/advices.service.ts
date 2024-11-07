import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";
import { NoticeResponse } from "./entities/noticeResponse.entity";


@Injectable()
export class AdvicesService{
    constructor(
        @InjectRepository(NoticeEntity)
        private readonly advicesRepository: Repository<NoticeEntity>,
    ){}

    async createNotice(notificationDto: NoticeDto): Promise<NoticeResponse> {
        const newNotice = this.advicesRepository.create(notificationDto);
        try {
            await this.advicesRepository.save(newNotice);
            return {
                isCreateNotice: true
            } as NoticeResponse;
        } catch (error) {
            console.log(error)
        }
        
        return {
            isCreateNotice: false
        } as NoticeResponse;
    }
    
    async getAllNotices(): Promise<NoticeEntity[]> {
        return await this.advicesRepository.find();
    }
}