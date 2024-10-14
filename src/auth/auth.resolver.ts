import { Resolver, Args, Mutation, Query, Context } from "@nestjs/graphql";

import { LoginDto } from "./dto/login.dto";
import { ForgorPassDto } from "./dto/forgotpass.dto";
import { AuthResponse } from "./entity/authresponse.entity";

import { AuthService } from "./auth.service";


@Resolver()
export class AuthResolver {

    constructor (private readonly authService : AuthService){}

    //Agregar mutation de registrar
    //Find User by Name
    //actualizar Informacion
    //Conseguir rol

    @Mutation(returns => AuthResponse)
    async login(@Args() logindDto : LoginDto ): Promise<AuthResponse>{
        return this.authService.login(logindDto);
    }

}