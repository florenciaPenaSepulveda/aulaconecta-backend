import { IsEmail} from "class-validator";
import { ArgsType, Field } from "@nestjs/graphql";

@ArgsType()
export class ForgotPassDto{

    @Field()
    @IsEmail()
    email: string;

}