import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { UserModule } from 'src/user/user.module';
import { SubjectEntity } from 'src/subject/entities/subject.entity';
import { AsistEntity } from 'src/asist/entities/asist.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MessageEntity, SubjectEntity, AsistEntity]),
        UserModule,
    ],
    providers: [MessagesService, MessagesResolver],
})
export class MessagesModule {}
