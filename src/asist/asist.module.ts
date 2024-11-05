import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsistEntity } from "./entities/asist.entity";
import { AsistResolver } from "./asist.resolver";
import { AsistService } from "./asist.service";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [TypeOrmModule.forFeature([AsistEntity]),
        UserModule,
    ],
    providers: [AsistResolver, AsistService]
})

export class AsistModule{};