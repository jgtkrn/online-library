import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsService } from './authors.service';
import { AuthMiddleware } from '../auth/auth.middleware'
import { AuthModule } from '../auth/auth.module';
// import { IsAdmin } from '../auth/admin.middleware';
import { IsEditor } from '../auth/editor.middleware';
import { Response } from '../../helpers/response';
import { AuthorBookEntity, AuthorTranslateEntity, AuthorEntity } from './entities'
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports: [ AuthModule, Response, TypeOrmModule.forFeature([  SubscriptionLogsEntity, AuthorBookEntity, AuthorTranslateEntity, AuthorEntity]) ],
  controllers: [AuthorsController],
  providers: [AuthorsService, Response],
})
export class AuthorsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply()
    .forRoutes(
      {path: 'authors', method: RequestMethod.GET},
      {path: 'authors/:id', method: RequestMethod.GET})
    .apply(AuthMiddleware, IsEditor)
    .forRoutes(
      {path: 'authors/', method: RequestMethod.POST},
      {path: 'authors/:id', method: RequestMethod.PUT},
    )
  }
}
