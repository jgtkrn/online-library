import { NestMiddleware, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth.middleware';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly authMiddleware: AuthMiddleware
    ) {}
    use(req: Request, res: Response, next: () => void) {
        const authHeaders = req.headers.authorization;
        if (authHeaders){
            return this.authMiddleware.use(req, res, next);
        } else {
            next();
        }
    }

}