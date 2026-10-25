import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MessageEntity } from './entities/message.entity';
import { UserService } from 'src/user/user.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserRoles } from 'src/user/enums/user-roles.enums';
import { SubjectEntity } from 'src/subject/entities/subject.entity';
import { AsistEntity } from 'src/asist/entities/asist.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(MessageEntity)
        private readonly messageRepository: Repository<MessageEntity>,
        @InjectRepository(SubjectEntity)
        private readonly subjectRepository: Repository<SubjectEntity>,
        @InjectRepository(AsistEntity)
        private readonly asistRepository: Repository<AsistEntity>,
        private readonly userService: UserService,
    ) {}

    async contactsFor(userId: number): Promise<UserEntity[]> {
        const user = await this.userService.assertRole(userId, [UserRoles.Teacher, UserRoles.Parents, UserRoles.Admin]);

        if (user.role === UserRoles.Admin) {
            const all = await this.userService.getAllUser();
            return all.filter(u => u.id !== userId && (u.role === UserRoles.Teacher || u.role === UserRoles.Parents));
        }

        if (user.role === UserRoles.Teacher) {
            const subjects = await this.subjectRepository.find({ where: { idTeacher: userId } });
            if (!subjects.length) {
                return [];
            }
            const records = await this.asistRepository.find({
                where: { idSubject: In(subjects.map(s => s.id)) },
            });
            const students = await this.userService.findUsersByIds([...new Set(records.map(r => r.idUser))]);
            const guardianIds = [...new Set(students.map(s => s.guardianId).filter(Boolean))] as number[];
            return this.userService.findUsersByIds(guardianIds);
        }

        const children = await this.userService.getChildren(userId);
        if (!children.length) {
            return [];
        }
        const records = await this.asistRepository.find({
            where: { idUser: In(children.map(c => c.id)) },
        });
        if (!records.length) {
            return [];
        }
        const subjects = await this.subjectRepository.find({
            where: { id: In([...new Set(records.map(r => r.idSubject))]) },
        });
        return this.userService.findUsersByIds([...new Set(subjects.map(s => s.idTeacher))]);
    }

    async conversation(userId: number, withId: number): Promise<MessageEntity[]> {
        await this.assertCanChat(userId, withId);
        return this.messageRepository.find({
            where: [
                { fromId: userId, toId: withId },
                { fromId: withId, toId: userId },
            ],
            order: { createdAt: 'ASC', id: 'ASC' },
        });
    }

    async send(userId: number, toId: number, content: string): Promise<MessageEntity> {
        const text = content.trim();
        if (!text) {
            throw new BadRequestException('El mensaje no puede estar vacío');
        }
        await this.assertCanChat(userId, toId);
        return this.messageRepository.save(
            this.messageRepository.create({ fromId: userId, toId, content: text }),
        );
    }

    private async assertCanChat(userId: number, otherId: number): Promise<void> {
        const contacts = await this.contactsFor(userId);
        if (!contacts.some(c => c.id === otherId)) {
            throw new ForbiddenException('No puedes conversar con este usuario');
        }
    }
}
