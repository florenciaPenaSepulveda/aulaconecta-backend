import { ArgsType, Field } from "@nestjs/graphql";

@ArgsType()
export class ChangePasswordDto{

    @Field()
    newPassword: string;
}