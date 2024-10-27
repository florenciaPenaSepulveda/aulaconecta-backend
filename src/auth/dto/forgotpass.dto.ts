import { IsEmail } from "class-validator";
import { ArgsType, Field, InputType } from "@nestjs/graphql"; // Asegúrate de importar InputType

@InputType() // Añadir el decorador InputType
export class ForgotPassDto {
    @Field()
    @IsEmail()
    email: string; // Esta propiedad debe estar presente
}
