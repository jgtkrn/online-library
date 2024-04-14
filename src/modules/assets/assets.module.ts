import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AuthMiddleware } from '../auth/auth.middleware'
import { AuthModule } from '../auth/auth.module';
import { Response } from '../../helpers/response';
import { AssetsEntity } from './entities';
import { AwsModule } from '../../helpers/aws.helpers';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports: [ Response, TypeOrmModule.forFeature([AssetsEntity, SubscriptionLogsEntity]), AuthModule, AwsModule ],
  controllers: [AssetsController],
  providers: [AssetsService, Response, AwsModule],
  exports : [AssetsService]
})
export class AssetsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'upload/', method: RequestMethod.POST},
    )
  }
}
