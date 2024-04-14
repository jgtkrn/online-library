import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { AuthModule } from '../auth/auth.module';
import { IsAdmin } from '../auth/admin.middleware';
import { IsEditor } from '../auth/editor.middleware';
import { Response } from '../../helpers/response';
import { AwsModule } from '../../helpers/aws.helpers';
import { AudioEntity, ChaptersEntity , ChaptersTranslateEntity} from './entities';
import { BookEntity ,BookTranslateEntity } from '../books/entities';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';
import { AssetsEntity } from '../assets/entities';

@Module({
  imports: [ AuthModule, Response, TypeOrmModule.forFeature([ SubscriptionLogsEntity, BookEntity ,AudioEntity, ChaptersEntity, BookTranslateEntity, ChaptersTranslateEntity, AssetsEntity ])],
  controllers: [ChaptersController],
  providers: [ChaptersService, Response, AwsModule],
  exports: [ChaptersService],
})
export class ChaptersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'chapters/book/:label', method: RequestMethod.GET},
      {path: 'chapters/:id', method: RequestMethod.GET})
    // .apply(AuthMiddleware, IsAdmin)
    .apply(AuthMiddleware, IsEditor)
    .forRoutes(
      {path: 'chapters/audio', method: RequestMethod.POST},
      {path: 'chapters/', method: RequestMethod.POST},
      {path: 'chapters/:id', method: RequestMethod.PUT},
      {path: 'chapters/:id', method: RequestMethod.DELETE},
      {path: 'chapters/audio/:id', method: RequestMethod.DELETE})
  }
}
