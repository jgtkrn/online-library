import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionalCodesController } from './promotional-codes.controller';
import { PromotionalCodesService } from './promotional-codes.service';
import { PromotionalCodeEntity } from './entities/promotional-codes.entity';
import { UserEntity, UserTokenEntity } from '../users/entities/index';
import { AuthMiddleware } from '../auth/auth.middleware';
import { IsAdmin } from '../auth/admin.middleware'
import { Response } from '../../helpers/response';
import { UsersService } from '../users/users.service';
import { EmailSender } from '../../helpers/email.sender';
import { AuthEntity } from '../auth/entities';
import { UserInterestEntity } from '../categories/entities';
import { SubscriptionPlanEntity } from '../subscription/entities/subscription-plan.entity';
import { UserSubscriptionEntity } from '../subscription/entities/user-subscription.entity';
import { UserPaymentEntity } from '../subscription/entities/user-payment.entity';
import { StripePaymentMethodEntity } from '../subscription/entities/stripe-payment-method.entity';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AuthModule } from '../auth/auth.module';
import { StripeHelper } from '../../helpers/stripe.helpers';
import { ExportFile } from '../../helpers/export-file';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports :   [ 
                EmailSender, 
                Response, 
                TypeOrmModule.forFeature([
                    PromotionalCodeEntity, 
                    UserEntity, 
                    UserTokenEntity, 
                    AuthEntity, 
                    UserInterestEntity, 
                    SubscriptionPlanEntity, 
                    UserPaymentEntity,
                    UserSubscriptionEntity,
                    StripePaymentMethodEntity,
                    SubscriptionLogsEntity
                ]), 
                AuthModule
              ],
  controllers: [PromotionalCodesController],
  providers: [PromotionalCodesService, UsersService, SubscriptionService, AuthService, Response, EmailSender, StripeHelper, ExportFile]
})
export class PromotionalCodesModule implements NestModule{
  configure(consumer: MiddlewareConsumer){
    consumer
    .apply()
    .forRoutes(
      {path: 'promotional-codes/list', method: RequestMethod.GET},
      {path: 'promotional-codes/detail/:code', method: RequestMethod.GET},
      {path: 'promotional-codes/check/:code', method: RequestMethod.GET},
    )
    .apply(AuthMiddleware, IsAdmin)
    .forRoutes(
      {path: 'promotional-codes/create', method: RequestMethod.POST},
    )
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'promotional-codes/claim', method: RequestMethod.POST},
    )
  }
}
