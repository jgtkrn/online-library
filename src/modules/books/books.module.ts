import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { AuthMiddleware } from '../auth/auth.middleware';
// import { IsAdmin } from '../auth/admin.middleware';
import { IsEditor } from '../auth/editor.middleware';
import { UserMiddleware } from '../auth/user.middleware';
import { AuthModule } from '../auth/auth.module';
import { Response } from '../../helpers/response';
import { BookEntity, BookTranslateEntity, BooksCategoriesEntity, CategoriesEntity, UserFavBooksEntity, UserFreebieBooksEntity } from './entities'
import { AuthorBookEntity, AuthorTranslateEntity, AuthorEntity } from '../authors/entities';
import { ChaptersEntity , AudioEntity} from '../chapters/entities';
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports: [ Response ,
    TypeOrmModule.forFeature([ 
        SubscriptionLogsEntity,
        BookEntity, 
        BookTranslateEntity, 
        BooksCategoriesEntity, 
        CategoriesEntity,  
        AuthorBookEntity,
        AuthorTranslateEntity, 
        AuthorEntity, 
        UserFavBooksEntity,
        UserFreebieBooksEntity,
        ChaptersEntity,
        AudioEntity,
      ]),
    AuthModule ],
  controllers: [BooksController],
  providers: [BooksService, Response],
  exports : [BooksService]
})
export class BooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(UserMiddleware)
    .forRoutes(
      {path: 'books/daily', method: RequestMethod.GET},
      {path: 'books/categories', method: RequestMethod.GET},
      {path: 'books/:id', method: RequestMethod.GET},
      {path: 'books/', method: RequestMethod.GET},
      {path: 'books/surprise-me', method: RequestMethod.GET}
    )
    // .apply(AuthMiddleware, IsAdmin)
    .apply(AuthMiddleware, IsEditor)
    .forRoutes(
      {path: 'books/', method: RequestMethod.POST},
      {path: 'books/:id', method: RequestMethod.PUT},
      {path: 'books/status/:id', method: RequestMethod.PUT})
    .apply(AuthMiddleware)
    .forRoutes(
      {path: 'books/my-desk', method: RequestMethod.GET},
      {path: 'books/my-progress', method: RequestMethod.POST},
      {path: 'books/my-fav', method: RequestMethod.POST},
      {path: 'books/my-fav/:label', method: RequestMethod.DELETE}
    )
  }
}
