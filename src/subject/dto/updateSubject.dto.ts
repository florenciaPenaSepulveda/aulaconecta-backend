import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class UpdateSubjectDto {
    @Field()
    name: string;

    @Field({ nullable: true })
    newName?: string;

    @Field(() => Int, { nullable: true })
    numberOfClasses?: number;
}