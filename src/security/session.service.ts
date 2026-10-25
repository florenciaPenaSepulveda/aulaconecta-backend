import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';

export interface TokenPayload {
    id: number;
    v: number;
}

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
    ) {}

    async isCurrent(payload: Partial<TokenPayload>): Promise<boolean> {
        if (typeof payload?.id !== 'number' || typeof payload?.v !== 'number') {
            return false;
        }
        const auth = await this.authRepository.findOne({ where: { idUser: payload.id }, select: { tokenVersion: true } });
        return auth !== null && auth.tokenVersion === payload.v;
    }
}
