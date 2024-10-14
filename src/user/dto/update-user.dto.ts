import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateUserDto {
    @Field({ nullable: true })
    firstName?: string;

    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: true })
    email?: string;
}