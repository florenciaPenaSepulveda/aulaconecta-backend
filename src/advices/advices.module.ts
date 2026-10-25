import { Module } from "@nestjs/common";
import { AdvicesResolver } from "./advices.resolver";
import { AdvicesService } from "./advices.service";
import { NoticeEntity } from "./entities/notice.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([NoticeEntity]),
        UserModule,
    ],
    providers: [AdvicesService, AdvicesResolver],
})
export class AdvicesModule {}
