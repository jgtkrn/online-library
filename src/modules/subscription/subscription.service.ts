import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, IsNull, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import Verifier from 'google-play-billing-validator';
const iap = require('in-app-purchase');

import { userLang } from '../../helpers/app.helpers';
import { StripePaymentMethodEntity } from './entities/stripe-payment-method.entity';
import {  UsersService } from '../users/users.service'
import { Response } from '../../helpers/response';
import { PaymentMethod } from './payment-method.interface';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { UserPaymentEntity } from './entities/user-payment.entity';
import { UserSubscriptionEntity } from './entities/user-subscription.entity';
import * as moment from 'moment-timezone';
import { SubscribeDto } from './dto/subscribe.dto';
import { StripeHelper } from '../../helpers/stripe.helpers';
import { payment_platforms, payment_status, subscription_status, stripe_plan_type, member_type, freeTrialValue, stripe_price_id } from '../../helpers/util';
import { Logger } from '../../helpers/logger';
import { String } from 'aws-sdk/clients/cloudhsm';
import { sort_by, google_billing_client, payment_method } from '../../helpers/util';
import { CreateCustomerDto, CreatePaymentMethodDto, CreateSubscriptionDto, UpdateCancelEndPeriodSubscribeDto, UpdateSubscriptionDto } from './dto';
import { loggers } from 'winston';
import { Json } from 'aws-sdk/clients/robomaker';
import { SubscriptionLogsEntity } from './entities/subscription-logs.entity';
import { ExportFile } from '../../helpers/export-file';
import { UserEntity } from '../users/entities';
import GoogleBilling from "../../helpers/google.billing";
import AppleBilling from "../../helpers/apple.billing";
import axios from "axios";

const googleVerifier = new Verifier(google_billing_client)

@Injectable()
export class SubscriptionService {

    constructor (
        private readonly i18n: I18nService,
        private readonly response: Response,
        private readonly userService: UsersService,
        private readonly stripe : StripeHelper,
        private readonly exportFile: ExportFile,

        @InjectRepository(SubscriptionPlanEntity)
        private subscriptionPlanMethodRepository : Repository<SubscriptionPlanEntity>,

        @InjectRepository(UserPaymentEntity)
        private userPaymentRepository : Repository<UserPaymentEntity>,

        @InjectRepository(UserSubscriptionEntity)
        private userSubscriptionRepository : Repository<UserSubscriptionEntity>,

        @InjectRepository(SubscriptionLogsEntity)
        private subscriptionLogsRepository : Repository<SubscriptionLogsEntity>,

        @InjectRepository(StripePaymentMethodEntity)
        private stripePaymentMethodRepository : Repository<StripePaymentMethodEntity>,
    ) {}

    async getSubscription(id : string, stripe_id : string) {

        const param = id ?? stripe_id
        const column = id ? 'subscription_plan._id = :param' : 'subscription_plan.stripe_id = :param'


        const plan = await this.subscriptionPlanMethodRepository
        .createQueryBuilder('subscription_plan')
        .select([
            'subscription_plan._id as id',
            'subscription_plan.title as title',
            'subscription_plan.ref_code as ref_code',
            'subscription_plan.stripe_id as stripe_id',
            'subscription_plan.subscription_fee as fee',
            'subscription_plan.currency as currency',
            'subscription_plan.subscription_type as type',
            'subscription_plan.description as description',
            'subscription_plan._access as access',
        ])
        .where(column, { param })
        .getRawOne();

        if (!plan) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            const error = [{ "SubscriptionPlan" : message }];
            Logger.error(`Failed to getting Subscription Plan : ${param}`);
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
        return plan;
    }

    async getUserSubscription(id : string, order_id : string, payment_id : string) {

        const param = await this.getParamsUserSubscription(id, order_id, payment_id)
        const column = await this.getColumnUserSubscription(id, order_id, payment_id)

        const data = await this.userSubscriptionRepository
        .createQueryBuilder('user_subscription')
        .select([
            'user_subscription._id as id',
            'user_subscription._owner_id as owner_id',
            'user_subscription.status as status',
            'user_subscription.startdate as startdate',
            'user_subscription.enddate as enddate',
            'user_subscription.order_id as order_id',
            'user_subscription.payment_id as payment_id',
            'user_subscription.user_label as user_label',
            'user_subscription.extra_enddate as extra_enddate',
            'user_subscription.referral_code as referral_code',
            'user_subscription.is_referral_bonus_claimed as is_referral_bonus_claimed'
        ])
        .where(column, { param })
        .getRawOne();

        if (!data) {
            const error = [{ "UserSubscription" : `User Subscription data with id ${param} not found ` }];
            Logger.error(`Failed to get user subscription data : ${param}`);
            throw new HttpException(await this.response.response(
                await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) }),
                null, null), HttpStatus.NOT_FOUND
            )
        }
        return data;
    }

    async getUserPayment(id : string, trancationId : string, originalTransactionId : string){

        const param = await this.getParamsUserPayment(id, trancationId, originalTransactionId)
        const column = await this.getColumnUserPayment(id, trancationId, originalTransactionId)

        const data = await this.userPaymentRepository
        .createQueryBuilder('user_payment')
        .select([
            'user_payment._id as id',
            'user_payment._owner_id as user_id',
            'user_payment.subscription_ref_code as ref_code',
            'user_payment.paid_fee as paid_fee',
            'user_payment.status as status',
            'user_payment.currency as currency',
            'user_payment.transaction_id as transaction_id',
            'user_payment.original_transaction_id as original_transaction_id',
        ])
        .where(column, { param })
        .getRawOne();

        if (!data) {
            Logger.error(`UserPayment with id ${param} not found`);
            const message = await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "UserPayment" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.NOT_FOUND
            )
        }

        return data;
    };


    async getPaidPaymentByUserLabel(user_label: string){
        const data = await this.userPaymentRepository
        .createQueryBuilder('user_payment')
        .select([
            'user_payment._id as id',
            'user_payment._owner_id as user_id',
            'user_payment.subscription_ref_code as ref_code',
            'user_payment.paid_fee as paid_fee',
            'user_payment.status as status',
            'user_payment.currency as currency',
            'user_payment.transaction_id as transaction_id',
            'user_payment.original_transaction_id as original_transaction_id',
        ])
        .where('user_payment.user_label = :user_label', { user_label: user_label })
        .andWhere('user_payment.status = :status', { status: payment_status.PAID })
        .getRawMany();
        return data;

    }

    async getPaymentMethod(userId : string, stripeId : string, authId : string): Promise<PaymentMethod> {

        const param = userId ?? stripeId

        const column = userId ? 'stripe_paymentmethod.user_id = :param' : 'stripe_paymentmethod.stripe_id = :param'

        const data = await this.stripePaymentMethodRepository
        .createQueryBuilder('stripe_paymentmethod')
        .select([
            'stripe_paymentmethod.id as id',
            'stripe_paymentmethod.stripe_id as stripe_id',
            'stripe_paymentmethod.user_id as user_id',
        ])
        .where(column, { param })
        .getRawOne();

        if (!data) {
            Logger.error(`Paymentmethod with id ${param} not found`);
            const message = await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "PaymentMethod" : message }];
            throw new HttpException(await this.response.response(  message, null, error), HttpStatus.NOT_FOUND
            )
        }

        if (data['user_id'] != authId) {
            const message =   await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) })
            const error = [{ "PaymentMethod" : message }];
            Logger.error(`PaymentMethod : Payment method data owned by another user, unauthorized`);
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.UNAUTHORIZED
            )
        }

        return data;
    };

    async savePaymentMethod(paymentmethodID : string, userId : string, userEmail : string) {
        try{
            const payment = new StripePaymentMethodEntity()
            payment.user_id = userId
            payment.stripe_id = paymentmethodID
            payment.email = userEmail

            await payment.save();

        } catch (err) {
            Logger.error(`failed to save payment method, userId: ${userId}, error:${err}`);
            const message = await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null)});
            const error = [{ "PaymentMethod" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async subscribe(subscribeData : SubscribeDto, user: any, auth: any): Promise<Object>{


        if(user.member_type == member_type.PAID) {
            const message = await this.i18n.translate('message.SUBSCRIPTION.USER_HAS_ACTIVE_SUBSCRIPTION', { lang: await userLang(auth)});
            Logger.error(`Subscription failed : ${message}`);
            const error = [{ "Subscribe" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
        }

        // if(subscribeData['claim_trial'] && await this.userService.isFreeTrialClaimed(user.id)) {
        //     const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ALREADY_CLAIMED', { lang: await userLang(auth)});
        //     Logger.error(`Claim free trial error : ${message}`);
        //     const error = [{ "ClaimFreeTrial" : message }];
        //     throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
        // }

        if(subscribeData['claim_trial']) {
            // Bassed on https://atechsolution.atlassian.net/browse/BEDJOE-157
            // Free trial is only for monthly subscription
            if( subscribeData['plan_price_id'] !== stripe_price_id.MONTHLY) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ONLY_FOR_MONTHLY', { lang: await userLang(user)});
                Logger.error(`Claim free trial error : ${message}`, {data : subscribeData});
                const error = [{ "ClaimFreeTrial" : message }];
                throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
            }
            if( await this.userService.isFreeTrialClaimed(user.sub)) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ALREADY_CLAIMED', { lang: await userLang(user)});
                Logger.error(`Claim free trial error : ${message}`, {data : subscribeData});
                const error = [{ "ClaimFreeTrial" : message }];
                throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
            }
        }


        if(subscribeData['referral_code']) {
            const existing_payment = await this.getPaidPaymentByUserLabel(user.label);

            if(existing_payment.length > 0) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_ONLY_FOR_NEW_USER', { lang: await userLang(auth)});
                Logger.error(`Claim referral code error : ${message}`);
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }

            if(await this.userService.isReferralCodeClaimed(user.id)) {
                // const message = "Referral code has been claimed for this user"
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_ALREADY_CLAIMED', { lang: await userLang(auth)});
                Logger.error(`Claim referral code error : ${message}`);
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }
            const isReferralCodeValid = await this.checkReferralCode(subscribeData['referral_code']);
            if(!isReferralCodeValid) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_INVALID', { lang: await userLang(auth)});
                Logger.error(`Claim referral code error : ${message}`);
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }
        }

        const createpayment = await this.stripe.createPaymentMethod(subscribeData, user)

        if(!createpayment['id']) {
            Logger.error(`Create payment error : ${createpayment['raw']['message']}`, {user:user, data:createpayment});
            const error = [{ "PaymentMethod" : `${createpayment['raw']['message']}` }];
            throw new HttpException(await this.response.response('Create payment method failed', null, error), HttpStatus.BAD_REQUEST);
        }
        Logger.info(`PaymentMethod ${createpayment['id']} successfully created`);

        const register_customer = await this.stripe.createCustomer(user, createpayment['id'], null)

        if(!register_customer['id']) {
            Logger.error(`RegisterStripe : ${register_customer['raw']['message']}`, {user:user, data:register_customer});
            const error = [{ "RegisterStripe" : `${register_customer['raw']['message']}` }];
            throw new HttpException(await this.response.response('Register customer failed', null, error), HttpStatus.NOT_FOUND);
        }

        await this.userService.updateStripeId(user, register_customer['id'])
        Logger.info(`Save stripeId ${register_customer['id']} to user`, {user:user, data:register_customer});

        // Attach created payment method to user
        const attach = await this.stripe.attachPaymentMethodToUser(createpayment['id'], register_customer['id']);
        if(!attach['id']) {
            Logger.error(`Create attach error : ${attach['raw']['message']}`, {user:user, data:attach});
            const error = [{ "PaymentMethod" : `${attach['raw']['message']}` }];
            throw new HttpException(await this.response.response('Attach payment method failed', null, error), HttpStatus.BAD_REQUEST);
        }

        await this.savePaymentMethod(createpayment['id'], user.id, user.email),
        Logger.info(`Success save payment method`, {user:user, data:createpayment});

        // Set created payment method as default on stripe
        const defaultPayment = await this.stripe.setDefaultPaymentMethod(register_customer['id'], createpayment['id'])
        if(!defaultPayment['id']) {
            Logger.error(`Set default payment method failed: ${defaultPayment['raw']['message']}`, {user:user, data:defaultPayment});
            const error = [{ "PaymentMethod" : `${defaultPayment['raw']['message']}` }];
            throw new HttpException(await this.response.response('Attach payment method failed', null, error), HttpStatus.BAD_REQUEST);
        }

        Logger.info(`Successfully set default payment method ${createpayment['id']} to ${register_customer['id']}`, {user:user, data:createpayment});

        // const add7Days = moment().add(7, 'days').format("YYYY-MM-DD HH:mm:ss");
        const addFreeTrial = moment().add(freeTrialValue, 'hours').format("YYYY-MM-DD HH:mm:ss");
        const trialEnd = subscribeData['claim_trial'] ? moment(new Date(addFreeTrial)).format('X') : null;
        const couponId = subscribeData['promo_code']
        const subscribe = await this.stripe.createSubscription(register_customer['id'], subscribeData['plan_price_id'], parseInt(trialEnd))
        if(!subscribe['id']) {
            Logger.error(`Proccess subscription : ${subscribe['raw']['message']}`, {user:user, data:subscribe});
            const error = [{ "ProccessSubscription" : `${subscribe['raw']['message']}` }];
            throw new HttpException(await this.response.response('Create subscription failed', null, error), HttpStatus.BAD_REQUEST);
        }
        // If free trial claimed, set claim_referralcode to true
        if (trialEnd != null && subscribe['id']) {
            await this.userService.updateFreeTrial(user.id, true)
            Logger.info(`Free trial claimed on user ${user.id}`, {user:user});
        }

        this.saveSubscriptionLogs(user.label, payment_platforms.STRIPE, 'create.subscription', subscribe['id'], null, JSON.stringify(subscribeData), JSON.stringify(subscribe))

        Logger.info(`Successfully subscribe with id ${subscribe['id']}}`, {user:user, data:subscribe});

        const result = await this.getPaymentDataFromSubscribeResponse(subscribe)

        await this.insertSubscriptionData(result, user.id, subscribeData['plan_price_id'], subscribeData['referral_code'])

        return result;

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateSubscribe(subscribeData : UpdateCancelEndPeriodSubscribeDto, cancel_at_period_end : boolean, user_id : string) : Promise<Object>{

        const data = await this.getUserSubscription(null,subscribeData['subscription_id'], null)
        const user = await this.userService.getUser(user_id, null).getRawOne()

        if(data['user_label'] != user['label']) {
            Logger.error(`UpdateSubscription : Subcription data owned by another user, unauthorized`);
            const message =   await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) })
            const error = [{ "UpdateSubscription" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.UNAUTHORIZED);
        }

        const unsubscribe = await this.stripe.updateSubscription(subscribeData['subscription_id'], cancel_at_period_end, null, null);
    
        if(!unsubscribe['id']) {
            Logger.error(`UpdateSubscription: ${unsubscribe['raw']['message']}`);
            const error = [{ "UpdateSubscription" : `${unsubscribe['raw']['message']}` }];
            throw new HttpException(await this.response.response('Update subscription failed', null, error), HttpStatus.BAD_REQUEST);
        }
        return unsubscribe;
    }

    async insertSubscriptionData(data, userId, subscription_ref_code, referral_code) {
        const user = await this.userService.getUser(userId, null)
        .getRawOne();

        const queryRunner = getConnection().createQueryRunner();

        await queryRunner.connect();

        await queryRunner.startTransaction();

        try{
            const payment = new UserPaymentEntity()
            payment._database_id = ""
            payment._owner_id = userId
            payment._access = '[{"level": "read", "public": true}]'
            payment._created_by = userId
            payment._updated_by = userId
            payment.subscription_ref_code = subscription_ref_code;
            payment.paid_fee = data.paid_fee / 100
            payment.status = payment_status.UNPAID;
            payment.currency = data.currency.toUpperCase()
            payment.payment_method = payment_platforms.STRIPE
            payment.user_label = user['label']
            payment.original_transaction_id = data.subsription_id
            payment.transaction_id = await this.getTrancationIdFromSubscriptionResult(data)
            payment.remarks = null
            await queryRunner.manager.save(payment);

            const subscription = new UserSubscriptionEntity()
            subscription._database_id = ""
            subscription._owner_id = userId
            subscription._access = '[{"level": "read", "public": true}]'
            subscription._created_by = userId
            subscription._updated_by = userId
            subscription.startdate = new Date(moment.unix(data.start_date).tz('Hongkong').format("YYYY-MM-DD HH:mm:ss"))
            subscription.enddate = new Date(moment.unix(data.end_date).tz('Hongkong').format("YYYY-MM-DD HH:mm:ss"))
            subscription.subscription_ref_code = subscription_ref_code;
            subscription.original_fee = data.paid_fee / 100
            subscription.currency = data.currency.toUpperCase()
            subscription.user_label = user['label']
            subscription.order_id = data.subsription_id
            subscription.payment_id = await this.getTrancationIdFromSubscriptionResult(data)
            subscription.purchase_token = ""
            subscription.status = subscription_status.INACTIVE
            subscription.referral_code = referral_code
            await queryRunner.manager.save(subscription);

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) });
            const error = [{ "Subscription" : message }];
            Logger.error(err, {data, userId, subscription_ref_code});
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR)
        }

        finally {
            // release query runner
            await queryRunner.release();
        }
    }

    async getTrancationIdFromSubscriptionResult(data : any) : Promise<string> {
        return data.payment_intent_id ?? data.invoice_id
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async checkReferralCode(couponId : string): Promise<any> {
        const user = await this.userService.getUserByReferralCode(couponId)
        return user ? true : false;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getMonthlyPlanProductId() : Promise<String> {
        const type_plan = stripe_plan_type.MONTHLY;
        const plan = await this.subscriptionPlanMethodRepository
        .createQueryBuilder('subscription_plan')
        .select([
            'subscription_plan.stripe_id as stripe_id',
        ])
        .where('subscription_plan.subscription_type = :type_plan', {type_plan})
        .getRawOne();

        if (!plan) {
            Logger.error(`Data not found`);
            const message = await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "Subscription" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.NOT_FOUND);
        }

        return plan['stripe_id'];
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getPaymentDataFromSubscribeResponse(data : any) : Promise<Object> {
        return {
            subsription_id: data['id'],
            invoice_id: data['latest_invoice']['id'],
            status: data['latest_invoice']['payment_intent'] ? data['latest_invoice']['payment_intent']['status'] : null,
            paid_fee: data['latest_invoice']['amount_due'],
            currency: data['latest_invoice']['currency'],
            invoice_url: data['latest_invoice']['hosted_invoice_url'],
            payment_intent_id: data['latest_invoice']['payment_intent'] ? data['latest_invoice']['payment_intent']['id'] : null,
            client_secret: data['latest_invoice']['payment_intent'] ? data['latest_invoice']['payment_intent']['client_secret'] : null,
            start_date: data['current_period_start'],
            end_date: data['current_period_end'],
            discount_id: data['latest_invoice']['discount'] ? data['latest_invoice']['discount']['id'] : null,
            coupon_id: data['latest_invoice']['discount'] ? data['latest_invoice']['discount']['coupon']['id'] : null,
            discount_percent: data['latest_invoice']['discount'] ? data['latest_invoice']['discount']['coupon']['percent_off'] : null,
            coupon_validity_status: data['latest_invoice']['discount'] ? data['latest_invoice']['discount']['coupon']['valid'] : null,
        };
    }


    async getSubscriptionPlan(query): Promise<Object> {

        const skippedItems:number = (query.page - 1) * query.size;

        const subscription = this.subscriptionPlanMethodRepository
        .createQueryBuilder('subscriptionPlan')
        .select([
            'subscriptionPlan.description as description',
            'subscriptionPlan.title as title',
            'subscriptionPlan.sequence as sequence',
            'subscriptionPlan.price_tag as price_tag',
            'subscriptionPlan.subscription_fee as subscription_fee',
            'subscriptionPlan.currency as currency',
            'subscriptionPlan.badge as badge',
            `json_agg(DISTINCT jsonb_build_object
                ('subscription_type', subscriptionPlan.subscription_type,
                'id', subscriptionPlan._id, 'ref_code',
                subscriptionPlan.ref_code)) AS platform`,
        ])
        .groupBy(`
                subscriptionPlan.description,
                subscriptionPlan.title,
                subscriptionPlan.sequence,
                subscriptionPlan.price_tag,
                subscriptionPlan.subscription_fee,
                subscriptionPlan.currency,
                subscriptionPlan.badge
                `)
        .orderBy('subscriptionPlan.sequence', query.sort_sequence === sort_by.DESC ? sort_by.DESC : sort_by.ASC)

        let subscriptions = []

        try{
            if(query.size) {
                subscriptions = await subscription
                .offset(skippedItems)
                .limit(query.size)
                .getRawMany()
            } else {
                subscriptions = await subscription.getRawMany()
            }

            const subs = subscriptions.map(async (el)=>{
                Promise.all(el.platform.map((platform)=>{
                    const type = platform.subscription_type.split('_')
                    if( type[0] === payment_platforms.GOOGLE ) el.android = platform
                    if( type[0] === payment_platforms.APPLE ) el.ios = platform
                    if( type[0] === payment_platforms.STRIPE ) el.stripe = platform
                }));
                delete el.platform;
                return el;
            })

            return await Promise.all(subs)
        }catch(err){
            Logger.error(`failed to get subscription plans`, {error : err, data : query})
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            const error = [{ "SubscriptionPlan" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getParamsUserSubscription(id : string, order_id : string, payment_id : string) : Promise<string> {
        switch (true) {
            case id != null : {
                return id
            }
            case order_id != null : {
                return order_id
            }
            case payment_id != null : {
                return payment_id
            }
            default:
        }
    }

    async getColumnUserSubscription(id : string, order_id : string, payment_id : string) : Promise<string> {

        switch (true) {
            case id != null: {
                return 'user_subscription._id = :param'
              }
            case order_id != null: {
                return 'user_subscription.order_id = :param'
            }
            case payment_id != null: {
                return 'user_subscription.payment_id = :param'
            }
            default:
        }
    }

    async getParamsUserPayment(id : string, transaction_id : string, original_transaction_id : string) : Promise<string> {
        switch (true) {
            case id != null : {
                return id
            }
            case transaction_id != null : {
                return transaction_id
            }
            case original_transaction_id != null : {
                return original_transaction_id
            }
            default:
        }
    }

    async getColumnUserPayment(id : string, transaction_id : string, original_transaction_id : string) : Promise<string> {
        switch (true) {
            case id != null: {
                return 'user_payment._id = :param'
              }
            case transaction_id != null: {
                return 'user_payment.transaction_id = :param'
            }
            case original_transaction_id != null: {
                return 'user_payment.original_transaction_id = :param'
            }
            default:
        }
    }

    async getAllUserSub(userData){
        const user = await this.userService.getUser(userData.sub ?? userData['_id'], null)
        .getRawOne();
        const userLabel = user['label']

        const sub = await this.userSubscriptionRepository
            .createQueryBuilder('sub')
            .select([
                'sub._id as id',
                'sub.user_label as user_label',
                'sub.startdate as start_date',
                'sub.enddate as end_date',
                'sub.extra_enddate as extra_enddate',
                'sub.subscription_ref_code',
                'sub.status as status',
                'sub.purchase_token as purchase_token',
                'sub.order_id as subscription_id',
                'sub._created_at as created_at',
                'plan.subscription_type as subscription_type',
                'plan.title as title',
                'plan.price_tag as price_tag',
                'plan.subscription_fee as subsription_fee',
                'plan.currency as currency'
            ])
            .leftJoin(SubscriptionPlanEntity, 'plan', 'sub.subscription_ref_code = plan.ref_code')
            .where('sub.user_label = :label', { label: userLabel })
            .orderBy('sub._updated_at', 'DESC')
            .getRawOne();

        if (sub) {
            const stripe = await this.stripe.getSubscription(sub.subscription_id)
            if(stripe['id']) {
                sub['cancel_at_period_end'] = stripe['cancel_at_period_end']
            }
            return sub;
        } else {
            return null;
        }
    }

    async getUserSub(userData){
        const user = await this.userService.getUser(userData.sub ?? userData['_id'], null)
        .getRawOne();
        const userLabel = user['label']

        const sub = await this.userSubscriptionRepository
            .createQueryBuilder('sub')
            .select([
                'sub._id as id',
                'sub.user_label as user_label',
                'sub.startdate as start_date',
                'sub.enddate as end_date',
                'sub.extra_enddate as extra_enddate',
                'sub.subscription_ref_code',
                'sub.status as status',
                'sub.order_id as subscription_id',
                'sub._created_at as created_at',
                'plan.subscription_type as subscription_type',
                'plan.title as title',
                'plan.price_tag as price_tag',
                'plan.subscription_fee as subsription_fee',
                'plan.currency as currency'
            ])
            .leftJoin(SubscriptionPlanEntity, 'plan', 'sub.subscription_ref_code = plan.ref_code')
            .where('sub.user_label = :label', { label: userLabel })
            .andWhere('sub.status = :status', { status: subscription_status.ACTIVE})
            .orderBy('sub._created_at', 'DESC')
            .getRawOne();

        if (sub) {
            const stripe = await this.stripe.getSubscription(sub.subscription_id)
            if(stripe['id']) {
                sub['cancel_at_period_end'] = stripe['cancel_at_period_end']
            }
            return sub;
        } else {
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscriptionStatus(subscription_id : string) : Promise<Object> {

        if(!subscription_id) {
            Logger.error(`subscription_id cannot be empty`);
            const error = [{ "GetSetupIntent" : `subscription_id cannot be empty` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        const subs = await this.stripe.getSubscription(subscription_id);

        if(!subs['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) });
            Logger.error(`RetrieveSubscription: ${subs['raw']['message']}`);
            const error = [{ "RetrieveSubscription" : subs['raw']['message'] }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        return subs;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSubscriptionByUserLabel(user_label:string): Promise<Object>{
        const subs = await this.userSubscriptionRepository
        .createQueryBuilder('sub')
        .select([
            'sub._id as id',
            'sub.user_label as user_label',
            'sub.status as status',
            'sub.startdate as startdate',
            'sub.enddate as enddate',
            'sub.order_id as order_id',
            'sub.subscription_ref_code as ref_code',
            'sub.purchase_token as purchase_token'
        ])
        .where('sub.user_label = :user_label', { user_label: user_label})
        .andWhere('sub.status = :status', { status: subscription_status.ACTIVE})
        .getRawMany();

        return subs ?? null;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getUserSubscriptionByOrderId(order_id:string, user_label:string): Promise<Object>{
        const subs = await this.userSubscriptionRepository
        .createQueryBuilder('sub')
        .select([
            'sub._id as id',
            'sub.user_label as user_label',
            'sub.status as status',
            'sub.startdate as startdate',
            'sub.enddate as enddate',
            'sub.order_id as order_id',
            'sub.subscription_ref_code as ref_code',
            'sub.purchase_token as purchase_token'
        ])
        .where('sub.user_label = :user_label', { user_label: user_label})
        .andWhere('sub.order_id = :order_id', { order_id: order_id})
        .getRawOne();

        return subs ?? null;
    }


    async inactiveSubscription(subcription_id : string) {
        try {
            await this.userSubscriptionRepository.update({ order_id: subcription_id }, { status : subscription_status.INACTIVE, _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')});
            Logger.info(`Successfully inactive subscription with order_id ${subcription_id}`);
        } catch(error){
            Logger.error( `Failed inactive subscription with order_id ${subcription_id}`, {error :error});
        }
    }

    async getSubPLan(reffCode, currency = 'HKD'): Promise<object>{
        // fix currency

        return await this.subscriptionPlanMethodRepository
        .createQueryBuilder('sub')
        .select([
            'sub.subscription_fee as subscription_fee',
            'sub.currency as currency'
        ])
        .where('sub.ref_code = :refcode', { refcode: reffCode })
        .andWhere('sub.currency = :currency', { currency })
        .getRawOne();
    }

    async insertUserPayment(data, user): Promise<void>{

            const queryBuilder = getConnection().createQueryBuilder();
            const payment = {
                _database_id : "",
                _owner_id : user.sub,
                _access : '[{"level": "read", "public": true}]',
                _created_by : user.sub,
                _updated_by : user.sub,
                subscription_ref_code : data.subscription_ref_code,
                paid_fee : data.paid_fee,
                status : data.status,
                currency : data.currency,
                info : data.payment_info || null,
                payment_method : data.payment_method,
                user_label : user['label'],
                original_transaction_id : data.original_transaction_id,
                transaction_id : data.transaction_id,
                _created_at : moment().format('YYYY-MM-DD HH:mm:ss'),
                _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')
            }

            await queryBuilder.insert().into(UserPaymentEntity)
            .values(payment)
            .onConflict(`DO NOTHING`).execute();
            Logger.info(`Success insert user_payment ${ data.transaction_id}`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async upsertSubscription(data, user): Promise<void>{

        const queryBuilder = getConnection().createQueryBuilder();

        const subscriptionData = {
            _updated_by: user.sub,
            _created_by: user.sub,
            _owner_id: user.sub,
            _created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            _updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            _database_id : '',
            user_label: user['label'],
            startdate: data['start_date'],
            enddate: data['end_date'],
            subscription_ref_code : data['subscription_ref_code'],
            original_fee: data['original_fee'],
            currency: data['currency'] || 'HKD',
            order_id:  data['order_id'],
            purchase_token: data['purchase_token'],
            status: data['status'],
        }

        const currentSubscription = await this.getUserSubscriptionByOrderId(data['order_id'], user['label']);

        // If current subscription longer than purchased enddate no need to update
        if(currentSubscription &&  moment(data['end_date']).isBefore(moment(currentSubscription['enddate']) )){
            data['end_date'] = currentSubscription['enddate'];
        }

        await queryBuilder.insert().into(UserSubscriptionEntity)
            .values(subscriptionData)
            .onConflict(
                `(user_label, order_id)
                DO UPDATE SET "status" = :status,
                "purchase_token" = :token,
                "startdate" = :startdate,
                "enddate" = :enddate`)
            .setParameters({
                "status": data['status'],
                "token": data['purchase_token'],
                "startdate" : data['start_date'],
                "enddate" : data['end_date']
            })
            .execute();
    }

    async lastPayment(user) {
        return await this.userPaymentRepository
            .createQueryBuilder('payment')
            .select([
                'payment_method',
            ])
            .where('payment.user_label = :label', { label: user.label })
            .limit(1)
            .orderBy('_created_at', 'DESC')
            .getRawOne();
    }

    async checkIfRecordExpired(user) {
        const userInfo = await this.getSubscriptionByUserLabel(user['label']);
        if(userInfo) {
            return userInfo['enddate'] <= moment().format() ? true : false;
        }else{
            return false
        }
    }

    async verifySub(user) : Promise<Object> {
        const userLabel = user['label'];
        const currency = 'HKD';
        const latestUserSubscriptions = await this.getAllUserSub(user);
        const currentUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                    .getRawOne();
        let lastLoginData = currentUser['last_login_at'];
        let todayStart = new Date(moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'));
        if(lastLoginData < todayStart){
            let userLastLogin: any = {last_login_at: moment().format('YYYY-MM-DD HH:mm:ss')};
            await this.userService.updateUser(userLastLogin, user);
        }

        if (latestUserSubscriptions && latestUserSubscriptions.end_date > new Date()) {
            await this.userService.updateMemberType(user.sub, member_type.PAID);
            const afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                    .getRawOne();
            return {
                member_type : afterUser['member_type'],
                validity: true,
                lastReceipt: {},
                latestSubscription: latestUserSubscriptions
            }
        }

        if (latestUserSubscriptions && latestUserSubscriptions.end_date <= new Date()){
             const cross_payment = this.crossPlatformSubsCheck(user, latestUserSubscriptions, currency);
             return cross_payment;
        }

        const exp = await this.checkIfRecordExpired(user)
        return {
            member_type : currentUser['member_type'],
            validity: exp,
            lastReceipt: {},
            latestSubscription: {},
        }
    }

    async verifyGooglePurchase(user, purchaseData): Promise<any>{
        const activeSubscription = await this.getUserSub(user);

        const latestUserSubscriptions = await this.getAllUserSub(user);

        const currentUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
        const userLabel = user['label'];

        let googleSubscriptionId;
        let googleProductId;
        let googleProductToken;
        let receiptData;
        let currentToken;
        let afterUser;

        const currency = 'HKD';

        try{
            if (purchaseData.receipt !== "") {
                if (latestUserSubscriptions && latestUserSubscriptions.end_date > new Date()) {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                    afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
                    return {
                        member_type : afterUser['member_type'],
                        validity: true,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions
                    }
                }            
                receiptData = JSON.parse(purchaseData['receipt']);
                const userReceipt = {
                    ...receiptData,
                    developerPayload: 'ddr-google-billing-verification'
                };

                googleSubscriptionId = receiptData['orderId'];
                googleProductId = receiptData['productId'];
                googleProductToken = receiptData['purchaseToken'];

                // if there is an other user receipt
                const getSameSubs = await this.userSubscriptionRepository
                        .createQueryBuilder('sub')
                        .select(['sub.user_label as user_label'])
                        .where('sub.order_id = :order_id', { order_id: receiptData['orderId'] })
                        .orderBy('_created_at', 'DESC')
                        .getRawOne();
                if (getSameSubs && getSameSubs.user_label !== userLabel) {
                    if (latestUserSubscriptions && latestUserSubscriptions.end_date <= new Date()){
                         const cross_payment = this.crossPlatformSubsCheck(user, latestUserSubscriptions, currency);
                         return cross_payment;
                    }
                    return {
                        member_type : currentUser['member_type'],
                        validity: false,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions
                    }        
                }
            }

            if (purchaseData.receipt == "" && latestUserSubscriptions) {
                if (latestUserSubscriptions.end_date > new Date()) {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                    afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                .getRawOne();
                    return {
                        member_type : afterUser['member_type'],
                        validity : true,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions
                    }
                }

                if (latestUserSubscriptions.end_date <= new Date()) {
                    const getUserSubscriptionLog = await this.subscriptionLogsRepository
                        .createQueryBuilder('sublogs')
                        .select(['sublogs.request_body as request_body'])
                        .where('sublogs.user_label = :label', { label: userLabel })
                        .orderBy('sublogs.created_at', 'DESC')
                        .getRawOne();

                    currentToken = JSON.parse(getUserSubscriptionLog.request_body.receipt);
                    const sendToken = currentToken['purchaseToken'];
                    
                    googleSubscriptionId = latestUserSubscriptions.subscription_id;
                    googleProductId = latestUserSubscriptions.sub_subscription_ref_code;
                    googleProductToken = sendToken;
                }
            }

            if(purchaseData.receipt == "" && !latestUserSubscriptions) {
                await this.userService.updateMemberType(user.sub, member_type.FREE);
                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                .getRawOne();
                return {
                    member_type : afterUser['member_type'],
                    validity: false,
                    lastReceipt: {},
                    latestSubscription: {}
                }
            }

            const data = await GoogleBilling.getsubscriptionDetail(googleProductId, googleProductToken);
            // handling purchase data was dissapear from google
            if(data.code == 410){
                await this.userService.updateMemberType(user.sub, member_type.FREE);
                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                .getRawOne();
                return {
                    member_type : afterUser['member_type'],
                    validity: false,
                    lastReceipt: {},
                    latestSubscription: {}
                }
            }

            if (purchaseData.receipt !==  "") {
                this.saveSubscriptionLogs(user.label, payment_platforms.GOOGLE, 'verify.subscription', receiptData['orderId'], null, JSON.stringify(purchaseData), JSON.stringify(data));
            }

            Logger.info('verify google purchase',{user, data});

            if (data.acknowledgementState == 0) {
                throw new Error('Subscription not acknowledge');
            }

            const startDate = moment(parseInt(data.startTimeMillis)).format();
            const dateExpiry = moment(parseInt(data.expiryTimeMillis)).format();
            const subPlan = await this.getSubPLan(googleProductId);
            const subscriptionStatus = !!data.userCancellationTimeMillis ? subscription_status.INACTIVE : subscription_status.ACTIVE;

            const subData = {
                start_date: startDate,
                end_date: dateExpiry,
                subscription_ref_code: googleProductId,
                order_id: googleSubscriptionId,
                purchase_token: (purchaseData.receipt !== "") ? purchaseData['receipt'] : JSON.stringify(currentToken),
                status: subscriptionStatus,
                original_fee: subPlan['subscription_fee'],
            }

            const paymentData = {
                subscription_ref_code : googleSubscriptionId,
                paid_fee: subPlan['subscription_fee'],
                status : payment_status.PAID,
                currency : subPlan['currency'] || 'HKD',
                payment_method : payment_method.GOOGLE,
                payment_info : (purchaseData.receipt !== "") ? purchaseData['receipt'] : JSON.stringify(currentToken)
            }

            if( dateExpiry <= moment().format() ) {
                subData.status = subscription_status.INACTIVE;
                await this.userService.updateMemberType(user.sub, member_type.FREE);
            } else {
                await this.userService.updateMemberType(user.sub, member_type.PAID);
            }

            await this.upsertSubscription(subData, user);
            await this.insertUserPayment(paymentData, user);

            // If member claim free trial on this subscription update member status claim trial
            if(data && data.paymentState == 2) {
                await this.userService.updateFreeTrial(user.sub, true);
            }

            afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                .getRawOne();
            return {
                member_type : afterUser['member_type'],
                validity : dateExpiry >= moment().format() || activeSubscription ? true : false,
                lastReceipt: data,
                latestSubscription: latestUserSubscriptions
            }

        } catch(err) {
            // if(!err.isSuccessful) {
            //     await this.userService.updateMemberType(user.sub, member_type.FREE)
            // }
            const message = await this.i18n.translate('message.SUBSCRIPTION.VERIFY_GOOGLE_FAILED', { lang: await userLang(user) })
            Logger.error(message, { user: user, error : err });
            if (purchaseData.receipt !== "") {
                this.saveSubscriptionLogs(user.label, payment_platforms.GOOGLE, 'verify.subscription', receiptData['orderId'], null, JSON.stringify(purchaseData), err)
            }
            const error = [{ "subscription" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.NOT_FOUND);
        }
    }

    async verifyApple(user, purchaseData): Promise<any> {

        const region = purchaseData.region || 'HK';
        const applePassword = region == 'TW' ? process.env.APPLE_TW_BILLING_SECRET : process.env.APPLE_BILLING_SECRET;
        const sandbox_url = 'https://sandbox.itunes.apple.com/verifyReceipt';
        const ios_url = 'https://buy.itunes.apple.com/verifyReceipt';

        try {

            let form_field = {
                'receipt-data': purchaseData.receipt,
                'password': applePassword,
                'exclude-old-transactions': true
            };

            let checkdata = await axios.post(ios_url, form_field, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if( checkdata.data.status == 21007 ) {
                checkdata = await axios.post(sandbox_url, form_field, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }

            return checkdata.data.latest_receipt_info[0];
        
        } catch(error) {
            Logger.info('invalid verify purchase apple', { error : error, user : user, data : purchaseData, region });
        };

    }

    async verifyApplePurchase(user, purchaseData):Promise<any>{
        const activeSubscription = await this.getUserSub(user);
        const latestUserSubscriptions = await this.getAllUserSub(user);
        const currentUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
        const userLabel = user['label'];

        let receiptData;
        let purchaseDate;
        let expiryDate;
        let appleProductId;
        let appleOriginalTransactionId;
        let appleTransactionId;
        let applePurchaseToken;
        let afterUser;

        const currency = purchaseData.region == 'TW' ? 'TWD' : 'HKD';

        try{
            if (purchaseData.receipt !== "") {
                if (latestUserSubscriptions && latestUserSubscriptions.end_date > new Date()) {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                    afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
                    return {
                        member_type : afterUser['member_type'],
                        validity: true,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions
                    }
                }

                receiptData = await this.verifyApple(user, purchaseData);

                purchaseDate = receiptData['purchase_date_ms'];
                expiryDate = receiptData['expires_date_ms'];
                appleProductId = receiptData['product_id'];
                appleOriginalTransactionId =  receiptData['original_transaction_id']; 
                appleTransactionId = receiptData['transaction_id'];
                applePurchaseToken = purchaseData.receipt;

                // if there is an other user receipt
                const getSameSubs = await this.userSubscriptionRepository
                        .createQueryBuilder('sub')
                        .select(['sub.user_label as user_label'])
                        .where('sub.order_id = :order_id', { order_id: receiptData['original_transaction_id'] })
                        .orderBy('_created_at', 'DESC')
                        .getRawOne();
                if (getSameSubs && getSameSubs.user_label !== userLabel) {
                    if (latestUserSubscriptions && latestUserSubscriptions.end_date <= new Date()){
                         const cross_payment = this.crossPlatformSubsCheck(user, latestUserSubscriptions, currency);
                         return cross_payment;
                    }
                    return {
                        member_type : currentUser['member_type'],
                        validity: false,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions,
                    }      
                }
            }

            if (purchaseData.receipt == "" && latestUserSubscriptions) {
                if (latestUserSubscriptions.end_date > new Date()) {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                    afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
                    return {
                        member_type : afterUser['member_type'],
                        validity: true,
                        lastReceipt: {},
                        latestSubscription: latestUserSubscriptions
                    }
                }

                if (latestUserSubscriptions.end_date <= new Date()) {

                    const appleSubStatus = await AppleBilling.checkUserSubsToApple(latestUserSubscriptions.subscription_id);
                    purchaseDate = appleSubStatus.purchaseDate;
                    expiryDate = appleSubStatus.expiresDate;
                    appleProductId = appleSubStatus.productId;
                    appleTransactionId = appleSubStatus.transactionId;
                    appleOriginalTransactionId = appleSubStatus.originalTransactionId;
                    applePurchaseToken = latestUserSubscriptions.purchase_token;
                    receiptData = appleSubStatus;
                }
            }

            if(purchaseData.receipt == "" && !latestUserSubscriptions) {
                await this.userService.updateMemberType(user.sub, member_type.FREE);
                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                            .getRawOne();
                return {
                    member_type : afterUser['member_type'],
                    validity: false,
                    lastReceipt: {},
                    latestSubscription: {}
                }
            }

            if (purchaseData.receipt !==  "") {
                this.saveSubscriptionLogs(user.label, payment_platforms.APPLE, 'verify.subscription', appleOriginalTransactionId, null, JSON.stringify(purchaseData), JSON.stringify(receiptData))
            };

            const startDate = moment(parseInt(purchaseDate)).format();
            const dateExpiry = moment(parseInt(expiryDate)).format();

            const subPlan = await this.getSubPLan(appleProductId, currency);

            const subData = {
                start_date: startDate,
                end_date: dateExpiry,
                subscription_ref_code: appleProductId,
                order_id: appleOriginalTransactionId,
                purchase_token: applePurchaseToken,
                status: subscription_status.ACTIVE,
                original_fee: subPlan['subscription_fee'],
                currency: subPlan['currency'] || 'HKD',
            }

            const paymentData = {
                subscription_ref_code: appleProductId,
                paid_fee: subPlan['subscription_fee'],
                status: payment_status.PAID,
                currency: subPlan['currency'] || 'HKD',
                payment_method: payment_method.APPLE,
                original_transaction_id: appleOriginalTransactionId,
                transaction_id: appleTransactionId
            }

            if( dateExpiry <= moment().format() ) {
                subData.status = subscription_status.INACTIVE;
                await this.userService.updateMemberType(user.sub, member_type.FREE);
                Logger.info(`Inactivate member type ${user.sub}`)
            } else {
                await this.userService.updateMemberType(user.sub, member_type.PAID);
                Logger.info(`Activate member type ${user.sub}`)
            }

            await this.upsertSubscription(subData, user);
            await this.insertUserPayment(paymentData, user);

            // If member claim free trial on this subscription update member status claim trial
            if (purchaseData.receipt !== "") {
                if(receiptData['is_trial_period'] == "true") {
                    await this.userService.updateFreeTrial(user.sub, true);
                }
            }

            afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
            .getRawOne();

            return {
                member_type : afterUser['member_type'],
                validity : dateExpiry >= moment().format() ? true : false,
                lastReceipt : receiptData,
                latestSubscription: latestUserSubscriptions
            }

        }catch(err) {
            const message = await this.i18n.translate('message.SUBSCRIPTION.VERIFY_APPLE_FAILED', { lang: await userLang(user) })
            Logger.error(message, { user: user, error : err });
            const error = [{ "subscription" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.NOT_FOUND);
        }
    }

    async crossPlatformSubsCheck(user, latestSubs: any, currency) : Promise<Object> {
        // let startDate;
        // let dateExpiry;
        let subPlan;
        let subData;
        let paymentData;
        let afterUser;

        const userLabel = user['label'];
        const subs_ref = latestSubs.sub_subscription_ref_code;

        try {
            const currentPayment = await this.userPaymentRepository
                .createQueryBuilder('payment')
                .select([
                    'payment.payment_method as payment_method'
                ])
                .where('payment.user_label = :label', 
                    { 
                        label: userLabel,
                    })
                .orderBy('payment._updated_at', 'DESC')
                .getRawOne();

            if (currentPayment.payment_method == payment_method.APPLE) {
                const appleSubStatus = await AppleBilling.checkUserSubsToApple(latestSubs.subscription_id);
                const purchaseDate = appleSubStatus.purchaseDate;
                const expiryDate = appleSubStatus.expiresDate;
                const appleProductId = appleSubStatus.productId;
                const appleTransactionId = appleSubStatus.transactionId;
                const appleOriginalTransactionId = appleSubStatus.originalTransactionId;
                const applePurchaseToken = latestSubs.purchase_token;
                const receiptData = appleSubStatus;

                const startDateApple = moment(parseInt(purchaseDate)).format();
                const dateExpiryApple = moment(parseInt(expiryDate)).format();

                subPlan = await this.getSubPLan(appleProductId, currency);

                subData = {
                    start_date: startDateApple,
                    end_date: dateExpiryApple,
                    subscription_ref_code: appleProductId,
                    order_id: appleOriginalTransactionId,
                    purchase_token: applePurchaseToken,
                    status: subscription_status.ACTIVE,
                    original_fee: subPlan['subscription_fee'],
                    currency: subPlan['currency'] || 'HKD',
                }

                paymentData = {
                    subscription_ref_code: appleProductId,
                    paid_fee: subPlan['subscription_fee'],
                    status: payment_status.PAID,
                    currency: subPlan['currency'] || 'HKD',
                    payment_method: payment_method.APPLE,
                    original_transaction_id: appleOriginalTransactionId,
                    transaction_id: appleTransactionId
                }

                if( dateExpiryApple <= moment().format() ) {
                    subData.status = subscription_status.INACTIVE;
                    await this.userService.updateMemberType(user.sub, member_type.FREE);
                    Logger.info(`Inactivate member type ${user.sub}`)
                } else {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                    Logger.info(`Activate member type ${user.sub}`)
                }

                await this.upsertSubscription(subData, user);
                await this.insertUserPayment(paymentData, user);

                
                if(receiptData['is_trial_period'] == "true") {
                    await this.userService.updateFreeTrial(user.sub, true);
                }
                

                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                .getRawOne();

                return {
                    member_type : afterUser['member_type'],
                    validity : dateExpiryApple >= moment().format() ? true : false,
                    lastReceipt : receiptData,
                    latestSubscription: latestSubs
                }
            }

            if (currentPayment.payment_method == payment_method.GOOGLE) {
                const getUserSubscriptionLog = await this.subscriptionLogsRepository
                    .createQueryBuilder('sublogs')
                    .select(['sublogs.request_body as request_body'])
                    .where('sublogs.user_label = :label', { label: userLabel })
                    .orderBy('sublogs.created_at', 'DESC')
                    .getRawOne();

                const currentToken = JSON.parse(getUserSubscriptionLog.request_body.receipt);
                const sendToken = currentToken['purchaseToken'];
                
                const googleSubscriptionId = latestSubs.subscription_id;
                const googleProductId = latestSubs.sub_subscription_ref_code;
                const googleProductToken = sendToken;

                const data = await GoogleBilling.getsubscriptionDetail(googleProductId, googleProductToken);
                // handling purchase data was dissapear from google
                if(data.code == 410){
                    await this.userService.updateMemberType(user.sub, member_type.FREE);
                    afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                    .getRawOne();
                    return {
                        member_type : afterUser['member_type'],
                        validity: false,
                        lastReceipt: {},
                        latestSubscription: {}
                    }
                }

                if (data.acknowledgementState == 0) {
                    throw new Error('Subscription not acknowledge');
                }

                const startDateGoogle = moment(parseInt(data.startTimeMillis)).format();
                const dateExpiryGoogle = moment(parseInt(data.expiryTimeMillis)).format();
                subPlan = await this.getSubPLan(googleProductId);
                const subscriptionStatus = !!data.userCancellationTimeMillis ? subscription_status.INACTIVE : subscription_status.ACTIVE;

                subData = {
                    start_date: startDateGoogle,
                    end_date: dateExpiryGoogle,
                    subscription_ref_code: googleProductId,
                    order_id: googleSubscriptionId,
                    purchase_token: JSON.stringify(currentToken),
                    status: subscriptionStatus,
                    original_fee: subPlan['subscription_fee'],
                }

                paymentData = {
                    subscription_ref_code : googleSubscriptionId,
                    paid_fee: subPlan['subscription_fee'],
                    status : payment_status.PAID,
                    currency : subPlan['currency'] || 'HKD',
                    payment_method : payment_method.GOOGLE,
                    payment_info : JSON.stringify(currentToken)
                }

                if( dateExpiryGoogle <= moment().format() ) {
                    subData.status = subscription_status.INACTIVE;
                    await this.userService.updateMemberType(user.sub, member_type.FREE);
                } else {
                    await this.userService.updateMemberType(user.sub, member_type.PAID);
                }

                await this.upsertSubscription(subData, user);
                await this.insertUserPayment(paymentData, user);

                // If member claim free trial on this subscription update member status claim trial
                if(data && data.paymentState == 2) {
                    await this.userService.updateFreeTrial(user.sub, true);
                }

                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                                    .getRawOne();
                return {
                    member_type : afterUser['member_type'],
                    validity : dateExpiryGoogle >= moment().format() ? true : false,
                    lastReceipt: data,
                    latestSubscription: latestSubs
                }
            }

            if (currentPayment.payment_method == payment_method.STRIPE) {
                afterUser = await this.userService.getUser(user.sub ?? user['_id'], null)
                .getRawOne();

                return {
                    member_type : afterUser['member_type'],
                    validity : latestSubs.end_date >= moment().format() ? true : false,
                    lastReceipt : {},
                    latestSubscription: latestSubs
                }
            }
        } catch (error) {
            Logger.error(`Subscription not found, error:${error}`);
        }

    }

    // New Subscription Flow
    // eslint-disable-next-line @typescript-eslint/ban-types
    async createCustomer(user : any, createCustomerData : CreateCustomerDto, auth : any) : Promise<Object> {

        if(user.member_type == member_type.PAID) {
            const message = await this.i18n.translate('message.SUBSCRIPTION.USER_HAS_ACTIVE_SUBSCRIPTION', { lang: await userLang(auth)});
            Logger.error(`CreateCustomer failed : ${message}`);
            const error = [{ "CreateCustomer" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
        }

        const customer = await this.stripe.createCustomer(user, null, createCustomerData)
        if(!customer['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(auth) });
            Logger.error(`CreateCustomer: ${customer['raw']['message']}`, {user:user, error : customer});
            const error = [{ "CreateCustomer" : message }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        return customer;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async createPaymentMethod(user : any, createPaymentData : CreatePaymentMethodDto, auth : any) : Promise<Object> {

        if(user.member_type == member_type.PAID) {
            const message = await this.i18n.translate('message.SUBSCRIPTION.USER_HAS_ACTIVE_SUBSCRIPTION', { lang: await userLang(auth)});
            Logger.error(`CreatePaymentMethod failed : ${message}`);
            const error = [{ "CreatePaymentMethod" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
        }

        const createpayment = await this.stripe.createPaymentMethod(createPaymentData, user)

        if(!createpayment['id']) {
            Logger.error(`CreatePaymentMethod failed : ${createpayment['raw']['message']}`, {user:user, error : createpayment});
            const error = [{ "CreatePaymentMethod" : `${createpayment['raw']['message']}` }];
            throw new HttpException(await this.response.response('Create payment method failed', null, error), HttpStatus.BAD_REQUEST);
        }
        return createpayment;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async createSubscription(user : any, createSubscriptionnData : CreateSubscriptionDto) : Promise<Object> {
        if(user.member_type == member_type.PAID) {
            const message = await this.i18n.translate('message.SUBSCRIPTION.USER_HAS_ACTIVE_SUBSCRIPTION', { lang: await userLang(user)});
            Logger.error(`CreateSubscription failed : ${message}`);
            const error = [{ "CreateSubscription" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
        }

        // if(createSubscriptionnData['claim_trial'] && await this.userService.isFreeTrialClaimed(user.sub)) {
        //     Logger.error(`Claim free trial error : Free trial has been claimed for this user}`, {data : createSubscriptionnData});
        //     const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ALREADY_CLAIMED', { lang: await userLang(user)});
        //     const error = [{ "ClaimFreeTrial" : message }];
        //     throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR);
        // }

        if(createSubscriptionnData['claim_trial']) {
            if( createSubscriptionnData['price_id'] != stripe_price_id.MONTHLY) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ONLY_FOR_MONTHLY', { lang: await userLang(user)});
                Logger.error(`Claim free trial error : ${message}`, {data : createSubscriptionnData});
                const error = [{ "ClaimFreeTrial" : message }];
                throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
            }
            if( await this.userService.isFreeTrialClaimed(user.sub)) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.FREE_TRIAL_ALREADY_CLAIMED', { lang: await userLang(user)});
                Logger.error(`Claim free trial error : ${message}`, {data : createSubscriptionnData});
                const error = [{ "ClaimFreeTrial" : message }];
                throw new HttpException(await this.response.response( message, null, error), HttpStatus.BAD_REQUEST);
            }
        }

        if(createSubscriptionnData['referral_code']) {
            const existing_payment = await this.getPaidPaymentByUserLabel(user.label);

            if(existing_payment.length > 0) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_ONLY_FOR_NEW_USER', { lang: await userLang(user)});
                Logger.error(`Claim referral code error : ${message}`);
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }

            if(await this.userService.isReferralCodeClaimed(user.sub)) {
                // const message = "Referral code has been claimed for this user"
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_ALREADY_CLAIMED', { lang: await userLang(user)});
                Logger.error(`Claim referral code error : ${message}`, {user:user});
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }
            const isReferralCodeValid = await this.checkReferralCode(createSubscriptionnData['referral_code']);
            if(!isReferralCodeValid) {
                const message = await this.i18n.translate('message.SUBSCRIPTION.REFERRAL_INVALID', { lang: await userLang(user)});
                Logger.error(`Claim referral code error : ${message}`, {user:user, referral_code : createSubscriptionnData['referral_code']});
                const error = [{ "ClaimReferralCode" : message }];
                throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
            }
        }

        const paymentMethod = await this.stripe.attachPaymentMethodToUser(createSubscriptionnData.paymentmethod_id, createSubscriptionnData.customer_id);
        if(!paymentMethod['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) });
            Logger.error(`AttachPaymentMethod: ${paymentMethod['raw']['message']}`, {user:user, data : paymentMethod});
            const error = [{ "AttachPaymentMethod" : paymentMethod['raw']['message'] }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }


        await this.userService.updateStripeId(user, createSubscriptionnData.customer_id)
        Logger.info(`Save stripeId ${createSubscriptionnData.customer_id} to user`, {user:user});

        await this.savePaymentMethod(paymentMethod['id'], user.sub, user.email),
        Logger.info(`Success save payment method`, {user:user, data : paymentMethod});

        // Set created payment method as default on stripe
        const defaultPayment = await this.stripe.setDefaultPaymentMethod(createSubscriptionnData.customer_id, paymentMethod['id'])
        if(!defaultPayment['id']) {
            Logger.error(`Set default payment method failed: ${defaultPayment['raw']['message']}`, {user:user, data : defaultPayment});
            const error = [{ "PaymentMethod" : `${defaultPayment['raw']['message']}` }];
            throw new HttpException(await this.response.response('Attach payment method failed', null, error), HttpStatus.BAD_REQUEST);
        }

        Logger.info(`Successfully set default payment method ${defaultPayment['id']} to ${defaultPayment['id']}`, {user:user, data : defaultPayment});

        // const add7Days = moment().add(7, 'days').format("YYYY-MM-DD HH:mm:ss");
        const addFreeTrial = moment().add(freeTrialValue, 'hours').format("YYYY-MM-DD HH:mm:ss");
        const trialEnd = createSubscriptionnData.claim_trial? moment(new Date(addFreeTrial)).format('X') : null;
        const couponId = createSubscriptionnData['promo_code'];
        const subscribe = await this.stripe.createSubscription(createSubscriptionnData.customer_id, createSubscriptionnData.price_id, parseInt(trialEnd))
        if(!subscribe['id']) {
            Logger.error(`Proccess subscription : ${subscribe['raw']['message']}`, {user:user, data : subscribe});
            const error = [{ "ProccessSubscription" : `${subscribe['raw']['message']}` }];
            throw new HttpException(await this.response.response('Create subscription failed', null, error), HttpStatus.BAD_REQUEST);
        }
        // If free trial claimed, set claim_referralcode to true
        if (trialEnd != null && subscribe['id']) {
            await this.userService.updateFreeTrial(user.sub, true)
            Logger.info(`Free trial claimed on user ${user.sub}`);
        }

        Logger.info(`Successfully subscribe with id ${subscribe['id']}}`, {user:user, data : subscribe});

        const result = await this.getPaymentDataFromSubscribeResponse(subscribe)

        await this.insertSubscriptionData(result, user.sub, createSubscriptionnData.price_id, createSubscriptionnData.referral_code)

        return subscribe;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async previewInvoice(subscription_id : string, customer_id : string, price_id : string) : Promise<Object>{

        if(!subscription_id || !customer_id || !price_id) {
            Logger.error(`Subscription_id, Customer_id, and Price_id cannot be empty`);
            const error = [{ "GetUpcomingInvoice" : `Subscription_id, Customer_id, and Price_id cannot be empty` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        const subscription = await this.stripe.getSubscription(subscription_id);
        if(!subscription['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            Logger.error(`GetSubscription: ${subscription['raw']['message']}`);
            const error = [{ "GetSubscription" : subscription['raw']['message'] }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        const invoice = await this.stripe.getUpcomingInvoice(customer_id, price_id, subscription);
        if(invoice['object'] != 'invoice') {
            Logger.error(`Failed get upcoming invoice: ${invoice['raw']['message']}`);
            const error = [{ "GetUpcomingInvoice" : `${invoice['raw']['message']}` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        return invoice;

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async deleteSubscription(subscription_id : string, user) : Promise<Object>{
        const user_data = await this.userService.getUser(user.sub, null).getRawOne()
        const stripe_subs_id = await this.userSubscriptionRepository
        .createQueryBuilder('user_subscription')
        .select([
            'user_subscription.order_id as order_id',
            'user_subscription.status as status',
            'user_subscription.enddate as end_date'
        ])
        .where('user_subscription.order_id like :pattern AND user_subscription.user_label = :label', { pattern: `%sub_%`, label: user_data['label'] })
        .limit(1)
        .orderBy('user_subscription._updated_at', 'DESC')
        .getRawMany();
        let latest_stripe_id = null;
        if(stripe_subs_id.length == 0){
            Logger.error(`UpdateSubscription : No stripe subcription data from user`);
            const message =   await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "UpdateSubscription" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.NOT_FOUND);
        } else if (stripe_subs_id[0].end_date < new Date() || stripe_subs_id[0].status == 'INACTIVE'){
            Logger.error(`UpdateSubscription : No stripe subcription data from user`);
            const message =   await this.i18n.translate('message.GENERAL.ERROR.NOT_FOUND', { lang: await userLang(null) })
            const error = [{ "UpdateSubscription" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.NOT_FOUND);
        } else {
            latest_stripe_id = stripe_subs_id[0].order_id;
        }

        const data = await this.getUserSubscription(null, latest_stripe_id, null)
        

        if(data['user_label'] != user_data['label']) {
            Logger.error(`UpdateSubscription : Subcription data owned by another user, unauthorized`);
            const message =   await this.i18n.translate('message.USER.UNAUTHORIZED', { lang: await userLang(null) })
            const error = [{ "UpdateSubscription" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.UNAUTHORIZED);
        }
        const deletedSubscription = await this.stripe.updateSubscription(latest_stripe_id, true, null, null);
        // const deletedSubscription = await this.stripe.deleteSubscription(latest_stripe_id);
        console.log({user_Data: user.sub})
        await this.userService.updateMemberType(user.sub, member_type.FREE);
        await this.userSubscriptionRepository.update(
                        {order_id : latest_stripe_id, user_label: user_data['label']}, 
                        {status : subscription_status.INACTIVE, _updated_at : moment().format('YYYY-MM-DD HH:mm:ss'), enddate: moment().subtract(60, 'seconds').format('YYYY-MM-DD HH:mm:ss')}
                    );
        if(!deletedSubscription['id']){
            Logger.error(`Failed delete subscription: ${deletedSubscription['raw']['message']}`);
            const error = [{ "DeleteSubscription" : `${deletedSubscription['raw']['message']}` }];
            const message = await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_DELETE', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        return deletedSubscription;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async listSubscriptionByUser(customer_id : string) : Promise<Object>{
        if(!customer_id) {
            Logger.error(`Customer_id cannot be empty`);
            const error = [{ "GetUpcomingInvoice" : `Customer_id cannot be empty` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        const subscriptions = await this.stripe.listSubscription(customer_id);
        if(!subscriptions['object']){
            Logger.error(`Failed get subscription: ${subscriptions['raw']['message']}`);
            const error = [{ "GetSubscription" : `${subscriptions['raw']['message']}` }];
            const message = await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        return subscriptions;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateSubscription(user : any, updateSubscriptionData : UpdateSubscriptionDto) : Promise<Object>{
        const subscription = await this.stripe.getSubscription(updateSubscriptionData.subscription_id);
        if(!subscription['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) });
            Logger.error(`UpdateSubscription: ${subscription['raw']['message']}`, {user:user, data : subscription});
            const error = [{ "CreateCuUpdateSubscriptionstomer" : subscription['raw']['message'] }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        Logger.info(`Successfully find subscription ${subscription['id']}}`);

        const updateSubscription = await this.stripe.updateSubscription(subscription['id'], false, subscription['items'].data[0].id, updateSubscriptionData.price_id)
        if(!updateSubscription['id']) {
            const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(null) });
            Logger.error(`UpdateSubscription: ${updateSubscription['raw']['message']}`, {user:user, data : updateSubscription});
            const error = [{ "UpdateSubscription" : updateSubscription['raw']['message'] }];
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }

        Logger.info(`Successfully update subscription ${updateSubscription['id']}}`, {user:user, data : updateSubscription});
        return updateSubscription;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async pausePaymentCollectionSubscription(subscription_id : string, extra_date : string) : Promise<void>{

        const resume = moment(extra_date).format('X');

        const subscription = await this.stripe.pausePaymentCollectionSubscription(subscription_id, parseInt(resume));

        if(!subscription['id']) {
            Logger.error(`Failed to pause payment collection`, {error : subscription['raw']['message']});
        }

        Logger.info(`Successfully pause payment collection ${subscription['id']}}`);
    }

    async addFreeTrial(subscription_id: string, end_date: string) {
        const trial_end = moment(end_date).format('X')
        const subscription = await this.stripe.addFreeTrial(subscription_id, parseInt(trial_end));

        if (!subscription['id']) {
            Logger.error(`Failed to claim free trial`, {error : subscription['raw']['message']});
        }

        Logger.info(`Successfully claim free trial for ${subscription['id']}}`);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getSetupIntent(id : string) : Promise<Object>{
        if(!id) {
            Logger.error(`Setup Intent ID cannot be empty`);
            const error = [{ "GetSetupIntent" : `Setup Intent ID cannot be empty` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        const setupIntent = await this.stripe.retrieveSetupIntent(id);
        if(!setupIntent['id']){
            Logger.error(`Failed get setup intent: ${setupIntent['raw']['message']}`);
            const error = [{ "GetSetupIntent" : `${setupIntent['raw']['message']}` }];
            const message = await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST);
        }
        return setupIntent;
    }

    async getExportDataSubscription() {
        const data = await this.userSubscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoin(UserEntity, 'user','user.user_label = subscription.user_label')
        .leftJoin(SubscriptionPlanEntity, 'plan','plan.ref_code = subscription.subscription_ref_code')
        .select([
            'subscription._id as id',
            'subscription._owner_id as owner_id',
            'user.email as email',
            'user.deleted_at as user_deleted_at',
            'subscription.subscription_ref_code as subscription_ref_code',
            'plan.subscription_type as subscription_plan',
            'subscription.status as status',
            'subscription.startdate as startdate',
            'subscription.enddate as enddate',
            'subscription.order_id as order_id',
            'subscription.payment_id as payment_id',
            'subscription.user_label as user_label',
            'subscription.extra_enddate as extra_enddate',
            'subscription.referral_code as referral_code',
            'subscription.is_referral_bonus_claimed as is_referral_bonus_claimed',
            'subscription._created_at as created_at'
        ])
        .where('user._id IS NOT NULL')
        .andWhere('user.deleted_at IS NULL')
        .getRawMany();
        return data;
    }

    async saveSubscriptionLogs(user_label : string, platform : string, resource_name : string, resource_id : string, webhooks_url : string, request_body : Json, response_body : Json){


        try{
            const log = new SubscriptionLogsEntity()
            log.user_label = user_label
            log.type = platform
            log.transaction_name = resource_name
            log.transaction_id = resource_id
            log.webhooks_url = webhooks_url
            log.request_body = request_body
            log.response_body = response_body

            await log.save();
            Logger.info(`Success insert logs ${resource_id}`);

        } catch (err) {

            Logger.error(`Failed to save subscription logs resourceId: ${resource_id}, error:${err}`);
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async exportCsv(res){
        const fields = [
            {
                label: 'User Email',
                value: 'email'
              },
              {
                label: 'Plan',
                value: 'subscription_plan'
              },
              {
                label: 'Subscription Status',
                 value: 'status'
               },
              {
                label: 'Start Date',
                 value: 'startdate'
               },
               {
                label: 'End Date',
                 value: 'enddate'
               },
               {
                label: 'Extra End Date',
                 value: 'extra_enddate'
               },
               {
                label: 'Referral Code',
                 value: 'referral_code'
               },
          ];

        const subscriptionData = await this.getExportDataSubscription();

        const data = subscriptionData.map(subscription => ({
            ...subscription,
            startdate: moment(subscription.startdate).add(8, 'hours').format('YYYY-MM-DD HH:mm:ss'),
            enddate: moment(subscription.enddate).add(8, 'hours').format('YYYY-MM-DD HH:mm:ss')
        }));
        // return data;
        const time = moment().format('YYYYMMDDHHmmss');
        return this.exportFile.csv(res, 'subscription_'+time+'.csv', fields, data);
    }
}
