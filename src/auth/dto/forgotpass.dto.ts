import { IsEmail} from "class-validator";
import { ArgsType, Field } from "@nestjs/graphql";

@ArgsType()
export class ForgorPassDto{

    @Field()
    @IsEmail()
    email: string;

}