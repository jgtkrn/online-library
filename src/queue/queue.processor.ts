import {Process, Processor} from "@nestjs/bull";
import {CronSubscriptionService} from "../modules/subscription/cron.service";
import {AssetsService} from "../modules/assets/assets.service";
import {CategoryService} from "../modules/categories/categories.service";
import {CampaignsService} from "../modules/campaigns/campaigns.service";
import * as moment from "moment/moment";
import {Logger} from "../helpers/logger";

@Processor('background')
export class BackgroundProcessor {
    constructor(
        private readonly cronSubscriptionService: CronSubscriptionService,
        private readonly assetService: AssetsService,
        private readonly categoryService: CategoryService,
        private readonly campaignService : CampaignsService
    ) {}

    @Process('updateExpiredSubscription')
    async updateExpiredSubscriptionStatus() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        await this.cronSubscriptionService.cronUpdateMemberTypeWhenHaveNoActiveSubcription();
        Logger.info(`Update subscription status cron fired at ${now}`);
    }

    @Process('updateMemberType')
    async updateMemberType() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        await this.cronSubscriptionService.cronUpdateMemberTypeWhenHaveNoActiveSubcription();
        Logger.info(`Update member type fired at ${now}`);
    }

    @Process('updateCampaignBookCount')
    async updateCampaignBookCount() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        await this.campaignService.updateBookCount()
        Logger.info(`Update books count fired at ${now}`);
    }

    @Process('uploadLogs')
    async UploadLogs() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        await this.assetService.uploadLogs()
        Logger.info(`log file uploaded on bucket ${now}`);
    }
}
