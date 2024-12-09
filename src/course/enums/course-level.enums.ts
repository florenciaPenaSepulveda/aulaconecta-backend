import { registerEnumType } from '@nestjs/graphql';

export enum CourseLevel{
    Basica = "basica",
    Media = "media",
    Kinder = "kinder",
    PreKinder = "prekinder"
}

registerEnumType(CourseLevel, {
    name: "CourseLevels",
    description: "Son los niveles de enseñansa de los colegios"
})