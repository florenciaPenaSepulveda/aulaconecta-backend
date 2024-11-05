import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field, Int} from '@nestjs/graphql';

@InputType()
export class CreateAsistItemDto {
    @Field()
    idUser: number;

    @Field()
    idSubject: number;

    @Field()
    asist: number;
}

@InputType()
export class CreateAsistDto {
    @Field(() => [CreateAsistItemDto])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAsistItemDto)
    asistencias: CreateAsistItemDto[];
}