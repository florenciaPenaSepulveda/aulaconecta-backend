import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): { id: number } =>
        GqlExecutionContext.create(context).getContext().req.user,
);
