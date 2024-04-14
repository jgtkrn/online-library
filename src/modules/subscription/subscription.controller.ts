import { Get, Post, Param, Controller, Body, Query, Req, Res, HttpException, HttpStatus} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { SubscriptionService } from './subscription.service';
import { WebhooksService } from './webhooks.service';
import { Response } from '../../helpers/response';
import { User } from '../auth/auth.decorator';
import { UsersService } from '../users/users.service'
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam, ApiOperation, ApiQuery} from '@nestjs/swagger';
import { CancelSubscriptionDto, CreatePaymentMethodDto, CreateCustomerDto, CreateSubscriptionDto, SubscribeDto, UpdateCancelEndPeriodSubscribeDto, UpdateSubscriptionDto, VerifyPurchaseDto } from './dto';
import { Logger } from '../../helpers/logger';
import * as moment from 'moment'
import { payment_platforms } from '../../helpers/util';
import { CronSubscriptionService } from './cron.service';

const now = moment().format('YYYY-MM-DD HH:mm:ss');
@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
    constructor( 
        private readonly i18n: I18nService,
        private readonly response: Response,
        private readonly userService: UsersService,
        private readonly subscriptionService: SubscriptionService,
        private readonly webhooksService: WebhooksService,
        private readonly cronSubscriptionService : CronSubscriptionService
    ) {};

    @Get('/plan')
    @ApiOperation({ summary: 'get subscribtion plan' })
    @ApiQuery(({ name: 'page', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'size', allowEmptyValue: true, required: false }))
    @ApiQuery(({ name: 'sort_sequence', allowEmptyValue: true, required: false }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscriptionPlan(@Query() query): Promise<Object> {
        query.page = Number(query.page) || 1
        query.size = Number(query.size) 

        const data = await this.subscriptionService.getSubscriptionPlan(query)
        Logger.info(`success get subscription`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @Get('/user')
    @ApiOperation({ summary: 'Get User Subscribtion' })
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getUserSub(@User() user): Promise<Object> {
        const data = await this.subscriptionService.getUserSub(user);
    
        Logger.info(`Success get user subscription with`, { data, user });
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data ?? [], null
        );  
    }

    @Get('/detail/:id')
    @ApiParam(({ name: 'id',  allowEmptyValue: false,  required: true}))
    @ApiOperation({ summary: 'Detail Subscription Plan' })
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscription(@Param('id') id): Promise<Object> {
        const data = await this.subscriptionService.getSubscription(id, null);
    
        Logger.info(`Success get subscription with id: ${data['id']} from stripe data`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }
    
    @Post('/subscribe')
    @ApiBearerAuth('access-token')
    @ApiBody({type : SubscribeDto})
    @ApiOperation({ summary: 'Register user, create payment method, attach payment method, set default payment method, and proccess subscription in one api endpoint' })
    // eslint-disable-next-line @typescript-eslint/ban-types
    async subscribe(@User() user, @Body() subscribeDto : SubscribeDto) : Promise<Object> {
        const dataUser = await this.userService.findOne(user.sub, null)

        const data = await this.subscriptionService.subscribe(subscribeDto, dataUser, user)

        Logger.info(`Success proccess subscription`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            data, null
        );
    }

    @Post('/unsubscribe')
    @ApiBearerAuth('access-token')
    @ApiBody({type : UpdateCancelEndPeriodSubscribeDto})
    @ApiOperation({ summary: 'Cancel subscription' })
    // eslint-disable-next-line @typescript-eslint/ban-types
    async unsubscribe(@User() user, @Body() subscribeDto : UpdateCancelEndPeriodSubscribeDto) : Promise<Object> {
        const unsubscribe = await this.subscriptionService.updateSubscribe(subscribeDto, true, user.sub)

        Logger.info(`Success cancel subscription`, {user});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            unsubscribe, null
        );
    }

    @Post('/reactive-subscription')
    @ApiBearerAuth('access-token')
    @ApiBody({type : UpdateCancelEndPeriodSubscribeDto})
    @ApiOperation({ summary: 'Re-Active subscription' })
    // eslint-disable-next-line @typescript-eslint/ban-types
    async ReActiveSubscribe(@User() user, @Body() subscribeDto : UpdateCancelEndPeriodSubscribeDto) : Promise<Object> {

        const subs = await this.subscriptionService.updateSubscribe(subscribeDto, false, user.sub)

        Logger.info(`Success activate subscription`, {subs, user});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            subs, null
        );
    }

    @Post('/webhooks')
    @ApiOperation({ summary: 'Stripe Webhooks' })
    async webhooks(@Req() req){

        Logger.info(`Webhooks ${req.body['type']} with id ${req.body['id']} fired`);
        const subscription = await this.subscriptionService.getUserSubscription(null, req.body['data']['object']['subscription'], null)
        this.subscriptionService.saveSubscriptionLogs(subscription.user_label, payment_platforms.STRIPE, req.body['type'], req.body['data']['object']['subscription'], req.protocol+"://"+req.headers.host+req.url, req.body, null)

        await this.webhooksService.handleWebhooks(req.body)
    }


    @ApiOperation({ summary: 'Check is refferral code valid' })
    @ApiParam(({ name: 'referral_code',  allowEmptyValue: false,  required: true}))
    @Get('/check-referral-code/:referral_code')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async checkReferralCode(@User() user, @Param('referral_code') referral_code ) : Promise<Object> {
        const data = await this.userService.checkUserByReferralCode(referral_code, user.sub);

        Logger.info(`Success Check referral code ${referral_code}`, data);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            data, null
        );
    } 

    @ApiOperation({ summary: 'verify google purcchase' })
    @Post('/verify/purchase/google')
    @ApiBody({ type: VerifyPurchaseDto })
    @ApiBearerAuth('access-token')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async verifyBillingGoogle(@User() user, @Body() purchaseData: VerifyPurchaseDto) : Promise<Object> {
 
        const verify = await this.subscriptionService.verifyGooglePurchase(user, purchaseData);

        Logger.info(`Success verify google purchase, ${user.email}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            verify, null
        );
    } 

    @ApiOperation({ summary: 'verify apple purchase' })
    @Post('/verify/purchase/apple')
    @ApiBearerAuth('access-token')
    @ApiBody({ type: VerifyPurchaseDto })
    // eslint-disable-next-line @typescript-eslint/ban-types
    async verifyPurchaseApple(@User() user, @Body() purchaseData: VerifyPurchaseDto ) : Promise<Object> {

        const verify = await this.subscriptionService.verifyApplePurchase(user, purchaseData);
        Logger.info(`Success verify apple purchase, ${user.email}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            verify, null
        );
    } 

    @ApiOperation({ summary: 'verify subscription' })
    @Post('/verify')
    @ApiBearerAuth('access-token')
    // @ApiBody({ type: VerifyPurchaseDto })
    // eslint-disable-next-line @typescript-eslint/ban-types
    async multiPlatfromVerify(@User() user ) : Promise<object> {
       const verify = await this.subscriptionService.verifySub(user);
    
        Logger.info(`Success verify apple purchase, ${user.email}`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            verify, null
        );
    } 

    // New Subscription Flow
    @Post('/create-customer')
    @ApiBearerAuth('access-token')
    @ApiBody({ type : CreateCustomerDto})
    @ApiOperation({summary : "Create stripe customer (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createCustomer(@User() user, @Body() createCustomerData : CreateCustomerDto) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const customer = await this.subscriptionService.createCustomer(dataUser, createCustomerData, user);

        Logger.info(`Success register customer with email ${user.email} to stripe`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            customer, null
        );

    }
    // New Subscription Flow
    @Post('/create-payment-method')
    @ApiBearerAuth('access-token')
    @ApiBody({ type : CreatePaymentMethodDto})
    @ApiOperation({summary : "Create stripe payment mtehod (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createPaymentMethod(@User() user, @Body() createPaymentData : CreatePaymentMethodDto) : Promise<Object>{
        const dataUser = await this.userService.findOne(user.sub, null)
        const customer = await this.subscriptionService.createPaymentMethod(dataUser, createPaymentData, user);

        Logger.info(`Success create payment method stripe`);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            customer, null
        );
    }

    @Post('/create-subscription')
    @ApiBearerAuth('access-token')
    @ApiBody({type: CreateSubscriptionDto})
    @ApiOperation({summary : "Create Subscription (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createSubscription(@User() user, @Body() createSubscriptionData : CreateSubscriptionDto) : Promise<Object>{
        const subscription = await this.subscriptionService.createSubscription(user, createSubscriptionData);
        Logger.info(`Success create subscription`, createSubscriptionData);
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            subscription, null
        );
    }

    @Get('/preview-invoice')
    @ApiOperation({ summary: 'Preview Invoice (New Subscription Flow)' })
    @ApiQuery(({ name: 'subscription_id', allowEmptyValue: false, required: true }))
    @ApiQuery(({ name: 'customer_id', allowEmptyValue: false, required: true }))
    @ApiQuery(({ name: 'price_id', allowEmptyValue: false, required: true }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async previewInvoice(@Query() query): Promise<Object> {
        const data = await this.subscriptionService.previewInvoice(query.subscription_id, query.customer_id, query.price_id)
        Logger.info(`Succes get invoice`, {data, query});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @Post('/cancel-subscription')
    @ApiBearerAuth('access-token')
    @ApiBody({type: CancelSubscriptionDto})
    @ApiOperation({summary : "Cancel Subscription (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async cancelSubscription(@User() user, @Body() cancelSubscriptionData : CancelSubscriptionDto) : Promise<Object>{
        const subscription = await this.subscriptionService.deleteSubscription(cancelSubscriptionData.subscription_id, user);
        Logger.info(`Success cancel subscription`, {data:cancelSubscriptionData});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            subscription, null
        );
    }

    @Post('/update-subscription')
    @ApiBearerAuth('access-token')
    @ApiBody({type : UpdateSubscriptionDto})
    @ApiOperation({summary : "Update Subscription (New Subscription Flow)"})
    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateSubscription(@User() user, @Body() updateSubscriptionData : UpdateSubscriptionDto) : Promise<Object>{
        const subscription = await this.subscriptionService.updateSubscription(user, updateSubscriptionData)
        Logger.info(`Success update subscription`, {data:updateSubscriptionData});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(user) }), 
            subscription, null
        );
    }

    @Get('/list-subscription')
    @ApiOperation({ summary: 'Get list user subscription (New Subscription Flow)' })
    @ApiQuery(({ name: 'customer_id', allowEmptyValue: false, required: true }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async listSubscription(@Query() query): Promise<Object> {
        const data = await this.subscriptionService.listSubscriptionByUser(query.customer_id)
        Logger.info(`Succes get subscription`,{data, query});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );
    }

    @Get('/setup-intent')
    @ApiOperation({ summary: 'Retrieve setup Intent (New Subscription Flow)' })
    @ApiQuery(({ name: 'id', allowEmptyValue: false, required: true }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSetupIntent(@Query() query): Promise<Object> {

        const data = await this.subscriptionService.getSetupIntent(query.id)
        Logger.info(`Succes get setup intent`, {data, query});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );

    }

    @Get('/status-subscription')
    @ApiOperation({ summary: 'Get stripe subscription status' })
    @ApiQuery(({ name: 'subscription_id', allowEmptyValue: false, required: true }))
    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscriptionStatus(@Query() query): Promise<Object> {

        const data = await this.subscriptionService.getSubscriptionStatus(query.subscription_id)
        Logger.info(`Succes get status subscription`, {data, query});
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.SUCCESS_GET', 
            { lang: await userLang(null) }), 
            data, null
        );

    }


    @Post('/trigger-cronjob-subscription')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async trigerCronjobx(): Promise<Object> {
        await this.cronSubscriptionService.cronUpdateUserSubscriptionWhenExpired();
        return this.response.response(
            await this.i18n.translate('message.GENERAL.SUCCESS.PROCESSED', 
            { lang: await userLang(null) }), 
            [], null
        );

    }


    @ApiOperation({ summary: 'Download data user subscription'})
    @Get('download-csv')
    // eslint-disable-next-line @typescript-eslint/ban-types
    async exportUser(@Res() res){
    // async exportUser(){
       try { 
         Logger.info(`Export subscription processed`);
         return this.subscriptionService.exportCsv(res);     
       } catch (err) {
         Logger.error(`Failed to export user subscription data`, {error : err});
         const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
         const error = [{ "ExportCsvUserData" : message }];
         throw new HttpException(await this.response.response(  
             message,
             null, error), HttpStatus.INTERNAL_SERVER_ERROR
         )
       }
    } 

}
