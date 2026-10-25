import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { TypeOrmModule} from "@nestjs/typeorm";
import { SemesterEntity } from "./entity/semester.entity";
import { SemesterResolver } from "./semester.resolver";
import { SemesterService } from "./semester.service";

@Module({
    imports:[UserModule, TypeOrmModule.forFeature([SemesterEntity])],
    providers:[SemesterResolver, SemesterService],
    exports: [SemesterService]
})

export class SemesterModule{}