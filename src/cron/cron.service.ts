import { Injectable } from '@nestjs/common';
import { Cron,CronExpression } from '@nestjs/schedule';
import { Logger } from '../helpers/logger';
import { CronSubscriptionService } from "../modules/subscription/cron.service";
import { AssetsService } from "../modules/assets/assets.service";
import { CategoryService } from '../modules/categories/categories.service';
import { ChaptersService } from '../modules/chapters/chapters.service';
import * as moment from 'moment'
import { CampaignsService } from '../modules/campaigns/campaigns.service';
import {Queue} from "bull";
import {InjectQueue} from "@nestjs/bull";
@Injectable()
export class CronService {
    constructor(
        private readonly categoryService: CategoryService,
        private readonly chapterService: ChaptersService,

        @InjectQueue('background')
        private backgroundQueue: Queue

    ){}

    // Log Cron
    @Cron(CronExpression.EVERY_WEEK)
    async UploadLogs() {
        await this.backgroundQueue.add('uploadLogs', null, {});
    }

    @Cron('1 1 1,6,12,18 * * *')
    async insertFreebie() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        this.categoryService.insertFreebie()
        Logger.info(`Insert freebie cron fired at ${now}`);
    }

    // ======== NEVER RUN THIS EXPENSIVE CRON ======== //
    // Note: this cron will cost you $24K a day.
    // Cron to fill chapter audio with aws polly tts
    
    // @Cron('1 */1 * * * *')
    // async fillAudioPolly() {
    //     const now = moment().format('YYYY-MM-DD HH:mm:ss')
    //     this.chapterService.loopChapterAudio()
    //     Logger.info(`Fill chapter audio cron fired at ${now}`);
    // }

    // ======== NEVER RUN THIS EXPENSIVE CRON ======== //

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async updateCampaignBookCount() {
        await this.backgroundQueue.add('updateCampaignBookCount', null, {});
    }
}
