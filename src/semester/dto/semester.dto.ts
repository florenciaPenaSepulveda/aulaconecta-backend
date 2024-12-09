import { InputType, Field} from '@nestjs/graphql';

@InputType()
export class CreateSemesterDto{
    @Field()
    nameSemester: string;

    @Field()
    startDate : Date;

    @Field()
    endDate : Date;

    @Field()
    deadline : Date;
}