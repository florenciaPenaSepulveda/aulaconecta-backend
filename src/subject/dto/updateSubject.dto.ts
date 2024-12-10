import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateSubjectDto {

    @Field()
    @IsNotEmpty()
    name: string;

    @Field({ nullable: true })
    @IsOptional()
    newName?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    numberOfClasses?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    courseId?: number;
}