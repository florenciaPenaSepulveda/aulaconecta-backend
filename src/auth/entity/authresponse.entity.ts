import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class AuthResponse {
    @Field()
    token: string;

    @Field()
    message: string;

    @Field()
    verificacion: boolean;

    @Field() // Asegúrate de que este campo se llame como lo necesitas en la mutación
    email: string;

    @Field() // Si necesitas el ID del usuario, añade este campo
    id: number;
}
