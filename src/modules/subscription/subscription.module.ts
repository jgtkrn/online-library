import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMiddleware } from '../auth/auth.middleware';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from '../users/users.service';
import { UserEntity, UserTokenEntity } from '../users/entities' 
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { StripePaymentMethodEntity } from './entities/stripe-payment-method.entity';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { Response } from '../../helpers/response';
import { StripeHelper } from '../../helpers/stripe.helpers';
import { ExportFile } from '../../helpers/export-file';
import { EmailSender } from '../../helpers/email.sender';
import { AuthService } from '../auth/auth.service';
import { AuthEntity } from '../auth/entities';
import { UserPaymentEntity } from './entities/user-payment.entity';
import { UserSubscriptionEntity } from './entities/user-subscription.entity';
import { SubscriptionLogsEntity } from './entities/subscription-logs.entity';
import { WebhooksService } from './webhooks.service';
import { CronSubscriptionService } from './cron.service';
import { UserInterestEntity } from '../categories/entities';
import { IsAdmin } from '../auth/admin.middleware'

@Module({
  imports: [EmailSender, StripeHelper, TypeOrmModule.forFeature([SubscriptionLogsEntity,UserEntity, UserTokenEntity, StripePaymentMethodEntity, AuthEntity, SubscriptionPlanEntity, UserPaymentEntity, UserSubscriptionEntity, UserInterestEntity]), AuthModule],
  providers: [SubscriptionService, WebhooksService,CronSubscriptionService, StripeHelper, Response, UsersService, EmailSender, AuthService, ExportFile],
  controllers: [SubscriptionController ],
  exports: [SubscriptionService, WebhooksService, CronSubscriptionService],
})
export class SubscriptionModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply()
    .forRoutes(
      {path: 'subscription/webhooks', method: RequestMethod.POST},
      {path: 'subscription/plan', method: RequestMethod.GET},
      {path: 'subscription/:id', method: RequestMethod.GET}
    )
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'subscription/verify/purchase/google', method: RequestMethod.POST},
      {path: 'subscription/verify/purchase/apple', method: RequestMethod.POST},
      {path: 'subscription/verify', method: RequestMethod.POST},
      {path: 'subscription/user/', method: RequestMethod.GET},
      {path: 'subscription/subscribe', method: RequestMethod.POST},
      {path: 'subscription/unsubscribe', method: RequestMethod.POST},
      {path: 'subscription/reactive-subscription', method: RequestMethod.POST},
      {path: 'subscription/create-coupon', method: RequestMethod.POST},
      {path: 'subscription/create-customer', method: RequestMethod.POST},
      {path: 'subscription/create-payment-method', method: RequestMethod.POST},
      {path: 'subscription/create-subscription', method: RequestMethod.POST},
      {path: 'subscription/preview-invoice', method: RequestMethod.GET},
      {path: 'subscription/cancel-subscription', method: RequestMethod.POST},
      {path: 'subscription/update-subscription', method: RequestMethod.POST},
      {path: 'subscription/list-subscription', method: RequestMethod.GET},
      {path: 'subscription/setup-intent', method: RequestMethod.GET},
      {path: 'subscription/status-subscription', method: RequestMethod.GET},
      {path: 'subscription/check-referral-code/:referral_code', method: RequestMethod.GET}

    )
    .apply(AuthMiddleware, IsAdmin)
    .forRoutes(
      { path: 'subscription/download-csv', method: RequestMethod.GET },
      { path: 'subscription/trigger-cronjob-subscription', method: RequestMethod.POST },
    )
  }
}
