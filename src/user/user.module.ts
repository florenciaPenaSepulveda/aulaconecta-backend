import { Module } from "@nestjs/common";
import { TypeOrmModule} from "@nestjs/typeorm";
import { UserEntity } from "./entity/user.entity";
import { UserResolver } from "./user.resolver";
import { UserService } from "./user.service";
import { AuthEntity } from "src/auth/entity/auth.entity";

@Module({
    imports:[TypeOrmModule.forFeature([UserEntity, AuthEntity])],
    providers: [UserResolver, UserService],
    exports: [UserService],
})

export class UserModule{}