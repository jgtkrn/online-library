import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './categories.controller';
import { CategoryService } from './categories.service';
import { AuthMiddleware } from '../auth/auth.middleware';
import { UserMiddleware } from '../auth/user.middleware';
import { AuthModule } from '../auth/auth.module';
import { Response } from '../../helpers/response'
import { ChaptersEntity } from '../chapters/entities'
import { CategoriesEntity, CategoriesTranslateEntity, UserInterestEntity, CategoriesRelationshipEntity } from './entities';
import { UserFreebieBooksEntity, UserFavBooksEntity, BooksCategoriesEntity } from '../books/entities';
// import { IsAdmin } from '../auth/admin.middleware'
import { IsEditor } from '../auth/editor.middleware';
import { AssetsService } from '../assets/assets.service';
import { AssetsEntity } from '../assets/entities';
import { UserEntity} from '../users/entities';
import { AwsModule } from '../../helpers/aws.helpers';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports: [
    Response,
    TypeOrmModule.forFeature([
      SubscriptionLogsEntity,
      CategoriesEntity,
      CategoriesTranslateEntity,
      ChaptersEntity,
      UserInterestEntity,
      UserFreebieBooksEntity,
      UserFavBooksEntity,
      BooksCategoriesEntity,
      CategoriesRelationshipEntity,
      AssetsEntity,
      UserEntity
    ]),
    AuthModule
  ],
  controllers: [CategoryController],
  providers: [CategoryService, AssetsService, Response, AwsModule],
  exports: [CategoryService],
})
export class CategoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(UserMiddleware)
    .forRoutes(
      {path: 'category/', method: RequestMethod.GET},
      {path: 'category/detail/:id', method: RequestMethod.GET},
      {path: 'category/', method: RequestMethod.POST},
      {path: 'category/:id', method: RequestMethod.PUT},
      {path: 'category/expired-freebies', method: RequestMethod.GET}
    )
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'category/user-interest', method: RequestMethod.POST},
      {path: 'category/user-freebie', method: RequestMethod.GET},
      // {path: 'category/create', method: RequestMethod.POST}
    )
    .apply(AuthMiddleware, IsEditor)
    .forRoutes(
      {path: 'category/create', method: RequestMethod.POST},
      {path: 'category/switch-status/:id', method: RequestMethod.PUT},
      {path: 'category/update/:id', method: RequestMethod.PUT}
    )
  }
}
