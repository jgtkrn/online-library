import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity, AuthRoleEntity, RoleEntity, UserEntity } from './entities' 
import { Response } from '../../helpers/response'
import { IosAuthModule } from '../../helpers/ios.verify'
import { UsersService  } from '../users/users.service';
import { EmailSender } from '../../helpers/email.sender';
import { ExportFile } from '../../helpers/export-file';
import { GoogleVerify } from '../../helpers/google.oauth';
import { FacebookOauth } from '../../helpers/facebook.oauth';
import { AuthMiddleware } from './auth.middleware';
import { UserTokenEntity } from '../users/entities';
import { UserInterestEntity } from '../categories/entities';
import { UserPaymentEntity } from '../subscription/entities/user-payment.entity';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
    imports: [Response, IosAuthModule, EmailSender, TypeOrmModule.forFeature([SubscriptionLogsEntity, AuthEntity, AuthRoleEntity, RoleEntity, UserEntity, UserTokenEntity, UserInterestEntity, UserPaymentEntity ])],
    providers: [AuthService, Response, IosAuthModule, UsersService, EmailSender, GoogleVerify, FacebookOauth, AuthMiddleware, ExportFile],
    controllers: [AuthController],
    exports: [AuthService, Response, IosAuthModule, UsersService, EmailSender, AuthMiddleware],
})
export class AuthModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer
        .apply()
        .forRoutes(
          {path: 'login', method: RequestMethod.POST},
          {path: 'login/apple', method: RequestMethod.POST},
        )
      }

}
