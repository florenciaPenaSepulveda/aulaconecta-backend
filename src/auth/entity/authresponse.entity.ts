import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class AuthResponse {
    @Field()
    token: string;

    @Field()
    message :string;

    @Field()
    verificacion:boolean;
}