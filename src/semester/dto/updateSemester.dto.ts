import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateSemesterDto{
    @Field()
    nameSemester : string

    @Field({nullable:true})
    newNameSemester? : string

    @Field({nullable:true})
    startDate? : Date

    @Field({nullable:true})
    endDate? : Date;

    @Field({nullable:true})
    deadline? : Date;

}