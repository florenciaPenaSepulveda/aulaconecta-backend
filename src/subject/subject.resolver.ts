import { Resolver, Args, Mutation, Query, Context} from '@nestjs/graphql';
import { SubjectService } from './subject.service';
import { SubjectEntity } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/createSubject.dto';
import { UpdateSubjectDto } from './dto/updateSubject.dto';

@Resolver()
export class SubjectResolver{
    
    constructor (private readonly subjectService : SubjectService){}

    @Mutation(() => SubjectEntity, { description: 'Create a new subject by providing the name and number of classes.'})
    async createSubject(@Args('createSubjectInput', {description: 'The input data for creating a new subject, including name and number of classes.'}) createSubjectDto: CreateSubjectDto): Promise<SubjectEntity> {
        return this.subjectService.addNewSubject(createSubjectDto);
    }

    @Mutation(() => Boolean, { description: 'Remove a subject by its name. Returns true if deletion is successful.' })
    async removeSubject(@Args('name', { description: 'The name of the subject to delete.' }) name:string): Promise<boolean>{
        return this.subjectService.deleteSubject(name);
    }

    @Mutation(() => Boolean)
    async updateSubject(@Args('createSubjectInput') updateSubject: UpdateSubjectDto): Promise<SubjectEntity>{
        return this.subjectService.updateSubject(updateSubject);
    }


    @Query(() => [SubjectEntity])
    listSubject(): Promise<SubjectEntity[]>{
        return this.subjectService.findAll();
    }
}