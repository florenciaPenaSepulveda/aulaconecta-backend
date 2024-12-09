import { InputType, Field} from '@nestjs/graphql';

@InputType()
export class DeleteSemesterDto{
    @Field()
    nameSemester: string;
}