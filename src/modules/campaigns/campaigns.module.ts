import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CampaignsService } from './campaigns.service'
import { CampaignsController } from './campaigns.controller'
import { AuthMiddleware } from '../auth/auth.middleware'
import { AuthModule } from '../auth/auth.module'
// import { IsAdmin } from '../auth/admin.middleware'
import { IsEditor } from '../auth/editor.middleware'
import { CampaignEntity, CampaignBooksEntity } from './entities'
// import { BooksService } from '../books/books.service'
import { BooksModule } from '../books/books.module'
import { UserMiddleware } from '../auth/user.middleware'
import { SubscriptionLogsEntity } from '../subscription/entities/subscription-logs.entity';

@Module({
  imports: [BooksModule, TypeOrmModule.forFeature([ SubscriptionLogsEntity, CampaignEntity, CampaignBooksEntity ]), AuthModule],
  providers: [CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(UserMiddleware)
    .forRoutes(
      {path: 'campaigns', method: RequestMethod.GET},
      {path: 'campaigns/books/count', method: RequestMethod.GET},
      {path: 'campaigns/:id', method: RequestMethod.GET})
    .apply(AuthMiddleware, IsEditor)
    .forRoutes(
      {path: 'campaigns/', method: RequestMethod.POST},
      {path: 'campaigns/:id', method: RequestMethod.PUT},
      {path: 'campaigns/active/:id', method: RequestMethod.PUT},
    )
  }
}
