import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { SessionService } from './session.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AuthEntity])],
    providers: [SessionService],
    exports: [SessionService],
})
export class SecurityModule {}
