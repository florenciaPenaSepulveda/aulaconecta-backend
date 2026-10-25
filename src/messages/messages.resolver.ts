import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { Guard } from 'src/guard/guard';
import { CurrentUser } from 'src/guard/current-user.decorator';

@Resolver()
@UseGuards(Guard)
export class MessagesResolver {
    constructor(private readonly messagesService: MessagesService) {}

    @Query(() => [UserEntity], { description: 'Usuarios con los que el usuario autenticado puede conversar' })
    chatContacts(@CurrentUser() current: { id: number }): Promise<UserEntity[]> {
        return this.messagesService.contactsFor(current.id);
    }

    @Query(() => [MessageEntity])
    conversation(
        @CurrentUser() current: { id: number },
        @Args('withId', { type: () => Int }) withId: number,
    ): Promise<MessageEntity[]> {
        return this.messagesService.conversation(current.id, withId);
    }

    @Mutation(() => MessageEntity)
    sendMessage(
        @CurrentUser() current: { id: number },
        @Args('toId', { type: () => Int }) toId: number,
        @Args('content') content: string,
    ): Promise<MessageEntity> {
        return this.messagesService.send(current.id, toId, content);
    }
}
