import * as jwt from 'jsonwebtoken';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { UsersService  } from '../users/users.service';
import { AuthService } from './auth.service';
import { Logger } from '../../helpers/logger';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly i18n: I18nService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService
    ) {}

  async use(req: Request, res: Response, next: NextFunction) {
 
      const authHeaders = req.headers.authorization;

      const token = authHeaders ? (authHeaders as string).split(' ')[1] : null

      try{
        if (authHeaders && token ) {

          // decode the token
          const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);

          // check if user exist 
          let user;
          if( !decoded.sub ) {
            user = await this.usersService.getUser(null, decoded.email)
            .getRawOne()
          }else {
            user = await this.usersService.getUser(decoded.sub, null)
            .getRawOne()
          }

          if( !user ) throw new Error('Not Authorized');
          (req as any).user = decoded;

          const isTokenValid = await this.authService.isTokenValid(token);

          if(!isTokenValid){
            throw new Error('Not Authorized');
          }
          
          next();

        } else {
          throw new Error('Not Authorized');
        }
    }catch(err) {
        Logger.error(`user not Authorized`, {token : token});
        throw new HttpException( await this.i18n.translate('message.USER.UNAUTHORIZED', 
        { lang: await userLang(null)}), HttpStatus.UNAUTHORIZED);
    }
  }
}