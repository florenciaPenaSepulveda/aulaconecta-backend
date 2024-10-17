import { registerEnumType } from '@nestjs/graphql';

export enum UserRoles{
    Student = 'student',
    Teacher = 'teacher',
    Admin   = 'admin',
    Parents = 'parents'
}

registerEnumType(UserRoles, {
    name: 'UserRoles',
    description: 'The roles a user can have in the system',
});