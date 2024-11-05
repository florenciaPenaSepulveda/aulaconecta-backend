import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class SubjectResponse{
    @Field()
    isCreateSubject: boolean;
}