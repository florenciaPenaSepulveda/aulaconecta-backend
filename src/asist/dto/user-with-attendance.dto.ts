import { Field, ObjectType } from '@nestjs/graphql';
import { UserEntity } from 'src/user/entity/user.entity';

@ObjectType()
export class UserWithAttendanceDto {
    @Field(() => UserEntity)
    user: UserEntity;

    @Field()
    totalAsist: number;

    @Field()
    totalAbsences: number;
}
