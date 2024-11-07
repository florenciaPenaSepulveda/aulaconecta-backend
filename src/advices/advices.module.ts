import { Module } from "@nestjs/common";
import { AdvicesResolver } from "./advices.resolver";
import { AdvicesService } from "./advices.service";
import { NoticeEntity } from "./entities/notice.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports:[
        TypeOrmModule.forFeature([NoticeEntity])
    ],
    providers: [AdvicesService, AdvicesResolver]
})

export class AdvicesModule{}