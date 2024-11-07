import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NoticeEntity } from "./entities/notice.entity";
import { NoticeDto } from "./dto/notice.dto";


@Injectable()
export class AdvicesService{
    constructor(
        @InjectRepository(NoticeEntity)
        private readonly advicesRepository: Repository<NoticeEntity>,
    ){}

    async createNotice(notificationDto: NoticeDto): Promise<NoticeEntity> {
        const newNotice = this.advicesRepository.create(notificationDto);
        return await this.advicesRepository.save(newNotice);
    }
    
    async getAllNotices(): Promise<NoticeEntity[]> {
        return await this.advicesRepository.find();
    }
}