import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { UsersService  } from '../users/users.service';
import { AuthRoleEntity } from './entities';
import { Logger } from '../../helpers/logger';

@Injectable()
export class IsAdmin implements NestMiddleware {
  constructor(
    private readonly i18n: I18nService,
    private readonly usersService: UsersService
    ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // try{
    //     const userId = (req as any).user.sub;
    //     const user = await this.usersService.getUser(userId, null)
    //     .select(['role_id'])
    //     .leftJoin(AuthRoleEntity, 'authRole', 'user._id = authRole.auth_id')
    //     .getRawOne();

    //     if(user.role_id === null) {
    //         throw new Error('forbiden');
    //     }
    //     next();
    // }catch(err) {
      
    //     Logger.error(`user not an Admin`, {error : err});
    //     throw new Error( 
    //       await this.i18n.translate('message.USER.NOT_ADMIN_USER', 
    //       { lang: await userLang(null) })
    //   )
    // }

        const userId = (req as any).user.sub;
        const user = await this.usersService.getUser(userId, null)
        .select(['role_id'])
        .leftJoin(AuthRoleEntity, 'authRole', 'user._id = authRole.auth_id')
        .getRawOne();
        
        if(user.role_id !== 'Admin') {
            Logger.error(`User not an Admin, Unauthorized`, {userId : userId});
            throw new HttpException( await this.i18n.translate('message.USER.UNAUTHORIZED', 
            { lang: await userLang(null)}), HttpStatus.UNAUTHORIZED);
        }
        next();
  }
}