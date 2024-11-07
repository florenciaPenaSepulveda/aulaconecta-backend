import { ArgsType, Field } from "@nestjs/graphql";

@ArgsType()
export class NoticeDto {

    @Field()
    title: string;

    @Field()
    description: string;

    @Field({ nullable: true })
    imageUrl?: string;
}