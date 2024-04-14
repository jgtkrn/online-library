import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersManageService } from './users-manage.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { UserEntity, UserTokenEntity } from './entities';
import { AuthEntity } from '../auth/entities';
import { Response } from '../../helpers/response';
import { AuthMiddleware } from '../auth/auth.middleware';
import { IsAdmin } from '../auth/admin.middleware'
import { EmailSender } from '../../helpers/email.sender';
import { StripeHelper } from '../../helpers/stripe.helpers';
import { ExportFile } from '../../helpers/export-file';
// import { SubscriptionModule } from '../subscription/subscription.module';
import { CategoryModule } from '../categories/categories.module';
import { UserInterestEntity } from '../categories/entities';
import { UsersManageController } from './users-manage.controller';
import { SubscriptionService } from '../subscription/subscription.service';
import { UserPaymentEntity } from '../subscription/entities/user-payment.entity';
import { SubscriptionPlanEntity } from '../subscription/entities/subscription-plan.entity';
import { UserSubscriptionEntity } from '../subscription/entities/user-subscription.entity';
import { StripePaymentMethodEntity } from '../subscription/entities/stripe-payment-method.entity';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
    imports: [ Response, EmailSender, StripeHelper, AuthModule, CategoryModule, TypeOrmModule.forFeature([ UserEntity, UserTokenEntity, AuthEntity, UserInterestEntity, UserPaymentEntity, SubscriptionPlanEntity, UserSubscriptionEntity, StripePaymentMethodEntity, SubscriptionLogsEntity ]) ],
    providers: [UsersService, SubscriptionService, UsersManageService, EmailSender, Response, StripeHelper, ExportFile],
    controllers: [UsersController, UsersManageController],
    exports: [Response, EmailSender, StripeHelper],
})
export class UsersModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer
        .apply(AuthMiddleware)
        .forRoutes(
          { path: 'users/reset-password', method: RequestMethod.POST },
          { path: 'users/detail', method: RequestMethod.GET },
          { path: 'users', method: RequestMethod.PUT },
          { path: 'users/add-feedback', method: RequestMethod.POST },
        )
        .apply()
        .forRoutes(
          { path: 'users/confirm-password', method: RequestMethod.PUT },
          { path: 'users/registered/:email', method: RequestMethod.GET },
          { path: 'users/register', method: RequestMethod.POST },
          { path: 'users/forget-password', method: RequestMethod.POST },
          { path: 'users-manage', method: RequestMethod.GET },
        )   
         .apply(AuthMiddleware, IsAdmin)
        .forRoutes(
          { path: 'users/download-csv', method: RequestMethod.GET },
          { path: 'users-manage', method: RequestMethod.GET },
          { path: 'users-manage/detail/:id', method: RequestMethod.GET },
          { path: 'users-manage/create', method: RequestMethod.POST },
          { path: 'users-manage/update-password/:id', method: RequestMethod.PUT },
          { path: 'users-manage/delete/:id', method: RequestMethod.DELETE },
          { path: 'users-manage/send-reset-password', method: RequestMethod.POST },
          
        )
      }
}
