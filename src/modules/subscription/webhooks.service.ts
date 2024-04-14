import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { StripeHelper } from '../../helpers/stripe.helpers';
import { Response } from '../../helpers/response';
import { getConnection, Repository } from 'typeorm';
import { Logger } from '../../helpers/logger';
import { InjectRepository } from "@nestjs/typeorm";
import { UserSubscriptionEntity } from "./entities/user-subscription.entity";
import { UserPaymentEntity } from "./entities/user-payment.entity";
import {
    payment_status,
    subscription_status,
    member_type,
    email_subject,
    order_id_prefix,
    freeTrialValue
} from '../../helpers/util';
import * as moment from 'moment-timezone'
import * as ejs from 'ejs'
import * as path from 'path';
import { SubscriptionService } from "./subscription.service";
import { UsersService } from "../users/users.service";
import { EmailSender } from "../../helpers/email.sender";

// const now = moment().format('YYYY-MM-DD HH:mm:ss');

@Injectable()
export class WebhooksService {
    constructor (
        private readonly response : Response,
        private readonly stripe : StripeHelper,
        private readonly userService: UsersService,
        private readonly subscriptionService: SubscriptionService,
        private readonly emailSender: EmailSender,

        @InjectRepository(UserPaymentEntity)
        private userPaymentRepository : Repository<UserPaymentEntity>,

        @InjectRepository(UserSubscriptionEntity)
        private userSubscriptionRepository : Repository<UserSubscriptionEntity>,
    ) {}

    async handleWebhooks(request_body){
        const payloadString = JSON.stringify(request_body, null, 2);
        const secret = await this.stripe.getWebhooksKey();
        const header = await this.stripe.generateHeaderString(payloadString, secret);
        let event;
        try {
            event = await this.stripe.constructWebhooks(payloadString, header, secret);
        }  catch (err) {
            Logger.error(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {

            case 'invoice.payment_action_required': {
                const productTitle = await this.subscriptionService.getSubscription(null, event.data.object.lines.data[0].plan.product);
                const emailData = {
                    id_paymentintent : event['data']['object']['payment_intent'],
                    customer_email : event['data']['object']['customer_email'],
                    invoice_url : event['data']['object']['hosted_invoice_url'],
                    product_title : productTitle['title'],
                    amount : event['data']['object']['lines']['data'][0]['amount'] / 100,
                }
                await this.invoicePaymentConfirmationAction(emailData);
                Logger.info(emailData)
                break;
            }

            case 'invoice.payment_succeeded': {
              const subscriptionId = event['data']['object']['subscription']
              const paymentIntentId = event['data']['object']['payment_intent']
              const periodStart = event['data']['object']['lines']['data']['period'] ? event['data']['object']['lines']['data']['period']['start'] : event['data']['object']['lines']['data'][0]['period']['start'] ;
              const periodEnd = event['data']['object']['lines']['data']['period'] ? event['data']['object']['lines']['data']['period']['end'] : event['data']['object']['lines']['data'][0]['period']['end'];
              const amount = event['data']['object']['amount_paid'];
              await this.invoicePaymentSucceededEventAction(subscriptionId, paymentIntentId, parseInt(periodStart), parseInt(periodEnd), amount);
              Logger.info(`Payment with id ${subscriptionId} was paid`);
              break;
            }

            case 'customer.subscription.updated': {
                const subscriptionId = event['data']['object']['id']
                const subscriptionStatus = event['data']['object']['status']
                const subscriptionTrialEnd = event['data']['object']['trial_end']
                const pendingSetupIntent = event['data']['object']['pending_setup_intent']
                await this.customerSubscriptionUpdatedEventAction(subscriptionId, subscriptionStatus, subscriptionTrialEnd, pendingSetupIntent);
                Logger.info(`Subscription with order ${subscriptionId} was canceled`);
                break;
            }

            case 'setup_intent.setup_failed':
            case 'payment_intent.payment_failed': {
                const stripeCustomerId = event['data']['object']['customer'];
                await this.downgradeUserSubscription(stripeCustomerId);
                Logger.info(`Customer ${stripeCustomerId} card verification failed`);
                break;
            }

            case 'payment_intent.succeeded': {
                const stripeCustomerId = event['data']['object']['customer'];
                Logger.info(`Customer ${stripeCustomerId} card verification succeeded`);
                break;
            }

            case 'customer.created': {
                const stripeCustomerId = event['data']['object'];
                console.log({stripeCustomerId});
                break;
            } 

            case 'customer.subscription.deleted': {
                const stripeCustomerId = event['data']['object'];
                console.log({stripeCustomerId});
                break;
            }

            default:
              // Unexpected event type
              Logger.error(`${event.type} event haven't been handled`);
        }
    }


    async invoicePaymentConfirmationAction(emailData : any) {

        const template = await ejs.renderFile(path.join(__dirname, '/templates/payment-action.ejs'), { emailData })
        const email = {
            receiver : emailData['customer_email'],
            subject: email_subject.stripe_payment_confirmation,
            text: null,
            template
        }
        try {
            await this.emailSender.send(email)
            Logger.info(`Success send email to ${emailData['customer_email']}`)
        } catch (error) {
            Logger.error(`Failed send email`);
            Logger.error(error);
        }

    }

    async invoicePaymentSucceededEventAction(subscriptionId : string, paymentIntentId : string, periodStart : number, periodEnd : number, amount : number) {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');

        const subscription = await this.subscriptionService.getUserSubscription(null, subscriptionId, null)

        const payment = await this.subscriptionService.getUserPayment(null, null, subscriptionId)

        const paymentData = {
            status : payment_status.PAID,
            transaction_id : paymentIntentId,
            _updated_at : moment().format('YYYY-MM-DD HH:mm:ss')
        }

        const startdate = new Date(moment.unix(periodStart).format("YYYY-MM-DD HH:mm:ss"));
        const enddate = new Date(moment.unix(periodEnd).format("YYYY-MM-DD HH:mm:ss"));
        const current_extra_enddate = moment(subscription['extra_enddate']).format('YYYY-MM-DD HH:mm:ss');

        const new_extra_enddate = subscription['extra_enddate'] && current_extra_enddate > now ?  moment(current_extra_enddate).clone().add(1, 'month') : moment(enddate).clone().add(1, 'month') ;
        // const new_extra_enddate = moment(enddate).clone().add(30, 'days') ;

        const subscriptionData = {
            status : subscription_status.ACTIVE,
            payment_id : paymentIntentId,
            startdate : startdate,
            enddate : enddate,
            _updated_at : moment().format('YYYY-MM-DD HH:mm:ss'),
            extra_enddate : subscription.referral_code && subscription.is_referral_bonus_claimed == false  && amount > 0 ? new_extra_enddate : subscription.extra_enddate,
            is_referral_bonus_claimed : subscription.referral_code && amount > 0 ? true : false,
        }

        // await this.proccesSuccessPayment(subscription, payment, subscriptionId, paymentData, subscriptionData, new_extra_enddate)
        this.proccesSuccessPayment(subscription, payment, subscriptionId, paymentData, subscriptionData, new_extra_enddate, amount)

        return this.response.response(`Invoice payment succeeded`, [], null);
    }

    async proccesSuccessPayment(subscription, payment, subscriptionId, paymentData,subscriptionData, new_extra_enddate, amount) {

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if(payment) {
                queryRunner.manager.update(UserPaymentEntity, {original_transaction_id: subscriptionId}, paymentData);
                Logger.info(`Success update user payment data with origin transaction id ${subscriptionId}`);
            }
            if(subscription) {
                queryRunner.manager.update(UserSubscriptionEntity, {order_id: subscriptionId}, subscriptionData);
                Logger.info(`Success update user subscription data with order id ${subscriptionId}`);

                this.userService.updateMemberType(subscription['owner_id'], member_type.PAID);
                Logger.info(`Success update user member_type with id ${subscription['owner_id']}`);

                // Add Bonus if subscription with referral code
                if(subscription.referral_code && amount > 0) {

                    await this.userService.updateReferralCodeStatus(subscription.owner_id, true)
                    Logger.info(`Successfully update referral code status for${subscription.owner_id}`);

                    const trialEnd = moment(subscription['startdate']).tz('Hongkong').add(1, 'month').format("YYYY-MM-DD HH:mm:ss");
                    await this.subscriptionService.addFreeTrial(subscriptionId, trialEnd);
                    Logger.info(`${subscription.owner_id} success claim referral code ${subscription.referral_code}}`);

                    // Action for claimed referral code owner
                    if(subscription.is_referral_bonus_claimed == false) {
                        await this.insertBonusToOwnerReferral(subscription.referral_code, subscriptionId)
                    }
                }
            }
            Logger.info(`proccesSuccessPayment done`);
            await queryRunner.commitTransaction();
        } catch(err) {
            await queryRunner.rollbackTransaction();
            Logger.error({ "InvoicePaymentSucceeded Webhooks": err });
        } finally {
            await queryRunner.release();
        }
    }

    async insertBonusToOwnerReferral(referral_code, subscriptionId)
    {
        const owner = await this.userService.getUserByReferralCode(referral_code);
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        if(owner) {
            this.userService.updateMemberType(owner['id'], member_type.PAID);
            if(owner['user_subscriptions'].length) {

                    const owner_enddate = moment(owner['user_subscriptions'][0]['enddate']).format('YYYY-MM-DD HH:mm:ss');
                    const owner_current_extra_enddate = moment(owner['user_subscriptions'][0]['extra_enddate']).format('YYYY-MM-DD HH:mm:ss');

                    const new_extra_enddate = owner['user_subscriptions'][0]['extra_enddate'] && owner_current_extra_enddate > now ?  moment(owner_current_extra_enddate).clone().add(1, 'month') : moment(owner_enddate).clone().add(1, 'month') ;

                    await this.addExtraEndDate(owner['user_subscriptions'][0]['order_id']);

                    // Check if user subscribe with stripe
                    if(owner['user_subscriptions'][0]['order_id'].substring(0,3) == order_id_prefix.STRIPE) {
                        const ownerSubscriptionId = owner['user_subscriptions'][0]['order_id'];
                        const subscription = await this.stripe.getSubscription(ownerSubscriptionId);
                        const trialAnchor = subscription['trial_end'] ? moment.unix(subscription['trial_end']).tz('Hongkong') : moment(new Date()).tz('Hongkong')
                        const trialEnd = trialAnchor.add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
                        await this.subscriptionService.addFreeTrial(ownerSubscriptionId, trialEnd);
                    }

            } else {
                await this.insertFreeReferralCodeSubscription(owner['id'], referral_code, owner['user_label'], subscriptionId);
            }
            Logger.info(`Success insert bonus to owner referral code ${referral_code}`);
        }
    }

    async customerSubscriptionUpdatedEventAction(subscriptionId : string, subscriptionStatus : string, subscriptionTrialEnd : number, pendingSetupIntent?: string) {
        const trialEnd =  moment.unix(subscriptionTrialEnd).format("YYYY-MM-DD HH:mm:ss")

        if((subscriptionStatus == "past_due") || (subscriptionTrialEnd != null && trialEnd <= moment().add(60, 'minutes').format("YYYY-MM-DD HH:mm:ss")) || pendingSetupIntent) {
            const subscription = await this.subscriptionService.getUserSubscription(null, subscriptionId, null)

            const subscriptionData = {
                status : subscription_status.INACTIVE,
                _updated_at : moment().add(60, 'minutes').format("YYYY-MM-DD HH:mm:ss")
            }

            const queryRunner = getConnection().createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                if(subscription) {
                    await queryRunner.manager.update(UserSubscriptionEntity, {order_id : subscriptionId}, subscriptionData);
                    Logger.info(`Success update user subscription data with order id ${subscriptionId}`);

                    await this.userService.updateMemberType(subscription['owner_id'], member_type.FREE);
                    Logger.info(`Success update user member_type with id ${subscription['owner_id']}`);
                }
                await queryRunner.commitTransaction();
            } catch(err) {
                await queryRunner.rollbackTransaction();
                Logger.info("UpdatedSubscription Webhooks", { error: err});
            } finally {
                await queryRunner.release();
            }
        }

        return this.response.response(`Customer subscription updated`, [], null);
    }

    async addExtraEndDate(subscription_id:string) {

        const data = await this.subscriptionService.getUserSubscription(null,subscription_id, null);
        const extra_endate = await this.getexpiredSubscription(data);

        await this.userSubscriptionRepository.update({ order_id: subscription_id }, { extra_enddate :extra_endate});

        Logger.info(`Successfully update extra_enddate with order_id ${subscription_id}`);
    }

    async insertFreeReferralCodeSubscription(user_id:string, referral_code:string, user_label:string, subscriptionId) {
            const refCode = "referral_" + referral_code

            const subscriptionData = {
                _database_id : "",
                _owner_id : user_id,
                _created_by : user_id,
                _updated_by : user_id,
                _created_at : moment().format('YYYY-MM-DD HH:mm:ss'),
                _updated_at : moment().format('YYYY-MM-DD HH:mm:ss'),
                user_label : user_label,
                startdate : new Date(moment().format('YYYY-MM-DD HH:mm:ss')),
                enddate : new Date(moment().add(1, 'month').format('YYYY-MM-DD HH:mm:ss')),
                subscription_ref_code : refCode,
                original_fee : 0,
                currency : 'HKD',
                order_id : refCode,
                purchase_token : "",
                is_referral_bonus_claimed : true,
                status : subscription_status.ACTIVE,
            }

            try{
                await getConnection().createQueryBuilder()
                .insert()
                .into(UserSubscriptionEntity)
                .values(subscriptionData)
                .onConflict(
                    `(user_label, order_id) 
                    DO UPDATE SET "_updated_at" = :updated_at`)
                .setParameters({
                    "updated_at": moment().format('YYYY-MM-DD HH:mm:ss'),
                })
                .execute();

            }catch(err){
                Logger.error(`failed add bonus to referral code owner, error: ${err}`)
            }
    }

    async getexpiredSubscription(subscription){
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const enddate = moment(subscription['enddate']).format('YYYY-MM-DD HH:mm:ss');
        const extra_enddate = moment(subscription['extra_enddate']).format('YYYY-MM-DD HH:mm:ss');

        if(!subscription['extra_enddate']){
            return enddate >= now ? moment(enddate).clone().add(1, 'month') : moment(now).clone().add(1, 'month')
        }
        return extra_enddate >= now ? moment(extra_enddate).clone().add(1, 'month') : moment(now).clone().add(1, 'month')
    }

    async downgradeUserSubscription(stripeCustomerId) {

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const stripeCustomer = this.stripe.retrieveCustomer(stripeCustomerId);
            const user = await this.userService.getUser(null, stripeCustomer['email']).getRawOne();
            const subscription = await this.subscriptionService.getUserSub(user);
            if(subscription) {
                const subscriptionId = subscription['order_id'];
                const enddate = moment(subscription['enddate']);
                const startdate = moment(subscription['startdate']);

                if (Math.abs(enddate.diff(startdate, 'hour', false)) === freeTrialValue) {
                    await this.userService.updateFreeTrial(user._id, false);
                    Logger.info(`Revert user free trial value`);
                }

                const subscriptionData = {
                    status : subscription_status.INACTIVE,
                    _updated_at : moment().format("YYYY-MM-DD HH:mm:ss")
                };
                queryRunner.manager.update(UserSubscriptionEntity, {order_id: subscriptionId}, subscriptionData);
                Logger.info(`subscription ${subscriptionId} downgraded, payment not complete`);

                this.userService.updateMemberType(subscription['owner_id'], member_type.FREE);
                Logger.info(`Success update user member_type with id ${subscription['owner_id']}`);
            }
            Logger.info(`proccesSuccessPayment done`);
            await queryRunner.commitTransaction();
        } catch(err) {
            await queryRunner.rollbackTransaction();
            Logger.error({ "InvoicePaymentSucceeded Webhooks": err });
        } finally {
            await queryRunner.release();
        }
    }

}
