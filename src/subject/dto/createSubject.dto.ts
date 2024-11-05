import { InputType, Field, Int} from '@nestjs/graphql';

@InputType()
export class CreateSubjectDto {

    @Field()
    name: string;

    @Field(() => Int, { nullable: true })
    numberOfClasses: number;
}