import { Module, Logger } from '@nestjs/common';
import * as path from 'path';
import { I18nModule, I18nJsonParser } from 'nestjs-i18n';
import { ScheduleModule } from '@nestjs/schedule';
import { Response } from '../../helpers/response';
import { BooksModule } from '../books/books.module';
import { ChaptersModule } from '../chapters/chapters.module';
import { AuthorsModule } from '../authors/authors.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { UsersModule } from '../users/users.modules';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from '../../config/config.service';
import { CronService } from '../../cron/cron.service';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { CategoryModule } from '../categories/categories.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PromotionalCodesModule } from '../promotional-codes/promotional-codes.module';
import { fallbackLanguage } from '../../helpers/util';
import {BullModule} from "@nestjs/bull";
// import {FreebieProcessor} from "../categories/freebie.processor";
import {BackgroundProcessor} from "../../queue/queue.processor";

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: fallbackLanguage,
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
      }
    }),
      BullModule.registerQueue({
        name: 'background',
      }),
    AppModule,
    BooksModule,
    ChaptersModule,
    AuthorsModule,
    CampaignsModule,
    AuthModule,
    AssetsModule,
    CategoryModule,
    UsersModule,
    Response,
    Logger,
    SubscriptionModule,
    PromotionalCodesModule,
  ],
  controllers: [],
  providers: [ Logger, CronService, BackgroundProcessor ],
})
export class AppModule {}
