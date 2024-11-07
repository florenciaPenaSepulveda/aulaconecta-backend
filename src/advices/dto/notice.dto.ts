import { ArgsType, Field } from "@nestjs/graphql";

@ArgsType()
export class NotificationDto {

    @Field()
    title: string;

    @Field()
    description: string;

    @Field()
    imageUrl: string;
}