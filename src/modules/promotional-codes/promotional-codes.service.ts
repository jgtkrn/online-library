import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, getConnection } from 'typeorm';
import { Response } from '../../helpers/response';
import { queryDto, CreatePromotionalCodeDto } from './dto';
import { member_type, payment_platforms, sort_by, subscription_status } from '../../helpers/util';
import { Logger } from '../../helpers/logger';
import { I18nService } from 'nestjs-i18n';
import { userLang } from '../../helpers/app.helpers';
import { PromotionalCodeEntity } from './entities/promotional-codes.entity';
import { SubscriptionService } from "../subscription/subscription.service";
import { UserSubscriptionEntity } from "../subscription/entities/user-subscription.entity"
import * as moment from 'moment'
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities';

const now = moment().format('YYYY-MM-DD HH:mm:ss');

@Injectable()
export class PromotionalCodesService {
    constructor(
        private readonly response: Response,
        private readonly i18n: I18nService,
        private readonly subscriptionService : SubscriptionService, 
        private readonly userService : UsersService,

        @InjectRepository(PromotionalCodeEntity)
        private promotionalCodeRepository : Repository<PromotionalCodeEntity>,

        @InjectRepository(UserSubscriptionEntity)
        private userSubscriptionRepository : Repository<UserSubscriptionEntity>,

        @InjectRepository(UserEntity)
        private userRepository : Repository<UserEntity>

    ){}

    // eslint-disable-next-line @typescript-eslint/ban-types
    async findAll(query : queryDto) : Promise<Object>{
        await this.updateAllPromoCodes();
        const skippedItems:number = (query.page - 1) * query.size;

        let code = this.promotionalCodeRepository
        .createQueryBuilder('promotional_codes')
        .select([
            'promotional_codes.id as id',
            'promotional_codes.code as code',
            'promotional_codes.month_value as month_value',
            'promotional_codes.user_label as user_label',
            'promotional_codes.claimed_at as claimed_at',
        ])

        if(query.code){
            code = code.where('promotional_codes.code = :code', { code: query.code })
        }

        if(query.search) {
            code = code
            .andWhere(new Brackets(qb => {
                qb.where("lower(promotional_codes.code) like '%' || :searchCode || '%'", { searchCode: query.search.toLowerCase() })
            }))
        }

        const total = await code.getCount();

        code = code.orderBy('promotional_codes.created_at', query.sort === sort_by.ASC ? sort_by.ASC : sort_by.DESC)
        .offset(skippedItems)


        let codes = []

        try {
            if (query.size) {
                codes = await code.limit(query.size).getRawMany()
            } else {
                codes = await code.getRawMany()
            }

        } catch(err) {
            Logger.error(`failed to get promotional codes`, {error : err})
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(null) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

        const data = codes.map( async(el) =>{
            el.email = null;
            if(el.user_label !== null) {           
                let user_email_data = await this.userRepository
                    .createQueryBuilder('users')
                    .select([
                        'users.email as email'
                    ])
                    .where('users.user_label = :label', {label: el.user_label})
                    .getRawOne()
                el.email = user_email_data.email
            }
            return el;
        })

        return {
            page: query.page,
            size: query.size,
            total: total,
            codes: await Promise.all(data)
        };

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async detail(code : string) : Promise<Object>{
        const data = await this.promotionalCodeRepository
        .createQueryBuilder('promotional_codes')
        .select([
            'promotional_codes.id as id',
            'promotional_codes.code as code',
            'promotional_codes.month_value as month_value',
            'promotional_codes.user_label as user_label',
            'promotional_codes.claimed_at as claimed_at',
        ])
        .where('promotional_codes.code = :code', { code })
        .getRawOne();


        // data.email = null;

        // if(data.user_label !== null) {
        //     let user_email_data = await this.userRepository
        //             .createQueryBuilder('users')
        //             .select([
        //                 'users.email as email'
        //             ])
        //             .where('users.user_label = :label', {label: data.user_label})
        //             .getRawOne()
        //     data.email = user_email_data.email
        // }
        
        return data
    }

     // eslint-disable-next-line @typescript-eslint/ban-types
    async isPromotionalCodeValid(code : string) : Promise<Object>{
        const data = await this.detail(code);

        const isValid = data && data['claimed_at'] == null ? true : false;

       return {
            valid : isValid,
            code : code,
            value : isValid ? data['month_value'] : null,

       }

    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async create(request : CreatePromotionalCodeDto) : Promise<Object> {
        try {
            const code = new PromotionalCodeEntity()
            code.code = await this.generatePromtionalCode();
            code.month_value = request.month_value ?? 12;
            await code.save();
            return code;
        } catch(err) {
            Logger.error(`Failed to save promotional code`, {error: err});
            const message = await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null)});
            const error = [{ "PromotionalCode" : message }];
            throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async generatePromtionalCode(): Promise<string>{
        let result = '';
        const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for ( let i = 0; i < 12; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        Logger.info(`Generate promotional code ${result}`);

        const isCodeUsed = await this.detail(result) ? true : false;
        
        return isCodeUsed ? await this.generatePromtionalCode() : result;
    }

    async setClaimPromotionalCode(code : string) : Promise<void>{
        try {
            await this.promotionalCodeRepository.update({code : code}, {claimed_at : moment().local().format()});
            Logger.info(`Successfully claim promotional code ${code}`);
        } catch (error) {
            Logger.error( `Failed to claim promotional code ${code}`, {error : error});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "ClaimPromotionalCode" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async claim(code : string, user : any) : Promise<Object> {
        const promotionalCode = await this.detail(code);

        if(promotionalCode && promotionalCode['claimed_at'] == null) {
            this.subscriptionService.saveSubscriptionLogs(user.label, payment_platforms.PROMOTIONAL_CODE, 'claim_promotional_code', code, null, null, null)
            const subscription = await this.userService.getUserWithSubscription(user.id);
            const lastSubscription = subscription['user_subscriptions'][0];

            if(lastSubscription['status'] === subscription_status.ACTIVE) {

                return this.updateActiveSubscription(lastSubscription, promotionalCode, user)
            }

            return this.createNewSubscription(code, user, promotionalCode)


        } else {
            Logger.error(`Promotional code not valid ${code}`, {data : code});
            const error = [{ "ClaimPromotionalCode" : `Promotional code not valid ${code}` }];
            const message =  await this.i18n.translate('message.GENERAL.ERROR.INVALID_GET_DATA', { lang: await userLang(user) });
            throw new HttpException(await this.response.response(message, null, error), HttpStatus.BAD_REQUEST); 
        }
    }

    async updateActiveSubscription(lastSubscription : any, promotionalCode : any, user : any) {
        Logger.info(`Update subscription by claim promotional code ${promotionalCode.code}`, {user : user});
        const query = getConnection().createQueryRunner();
        await query.connect();
        await query.startTransaction();

        try{
            if(new Date(lastSubscription['enddate']) > new Date(lastSubscription['extra_enddate']) ){

                query.manager.update(UserSubscriptionEntity, {order_id : lastSubscription['order_id']}, {status : subscription_status.ACTIVE, enddate : moment(lastSubscription['enddate']).clone().add(promotionalCode['month_value'], 'months')})
                
            } else if (new Date(lastSubscription['enddate']) < new Date(lastSubscription['extra_enddate'])){

                query.manager.update(UserSubscriptionEntity, {order_id : lastSubscription['order_id']}, {status : subscription_status.ACTIVE, extra_enddate : moment(lastSubscription['extra_enddate']).clone().add(promotionalCode['month_value'], 'months')})
            }

            await this.setClaimPromotionalCode(promotionalCode['code']);
            await this.userService.updateMemberType(user.id, member_type.PAID);

            await query.commitTransaction();

            return {
                promotionalCode : promotionalCode,
                subscription : lastSubscription
            }
        } catch(err) {
            await query.rollbackTransaction();
            Logger.error({ "updateActiveSubscription error": err });
        } finally {
            await query.release();
        }
    }


    async createNewSubscription(code : string, user : any, promotionalCode : any) : Promise<Object> {
            Logger.info(`Create new subscription by claim promotional code ${code}`, {user : user});

            const query = getConnection().createQueryRunner();
            await query.connect();

            await query.startTransaction();

            try {
                const subscription = new UserSubscriptionEntity();
                subscription._database_id = ""
                subscription._owner_id = user.id
                subscription._access = '[{"level": "read", "public": true}]'
                subscription._created_by = user.id
                subscription._updated_by = user.id
                subscription.startdate =  new Date(moment().format('YYYY-MM-DD HH:mm:ss'))
                subscription.enddate = new Date(moment().add(promotionalCode['month_value'], "months").format('YYYY-MM-DD HH:mm:ss'))
                subscription.subscription_ref_code = 'promotional_'+code;
                subscription.original_fee = null
                subscription.currency = null
                subscription.user_label = user.label
                subscription.order_id = code
                subscription.payment_id = null
                subscription.purchase_token = ""
                subscription.status = subscription_status.ACTIVE
                subscription.referral_code = null
                await query.manager.save(subscription);

                await this.setClaimPromotionalCode(code);
                await this.userService.updateMemberType(user.id, member_type.PAID);

                await query.commitTransaction();

                return {
                    promotionalCode : await this.detail(code),
                    subscription : subscription
                }

            } catch (err) {
                await query.rollbackTransaction();
                const message =  await this.i18n.translate('message.GENERAL.ERROR.UNPROCESSED_CREATE', { lang: await userLang(user) });
                const error = [{ "ClaimPromotionalCode" : message }];
                Logger.error(`Failed claim promotional code ${code}`, {error: err, user : user});
                throw new HttpException(await this.response.response( message, null, error), HttpStatus.INTERNAL_SERVER_ERROR)
            }
    }

    async updateAllPromoCodes(): Promise<void> {

        let codes = await this.promotionalCodeRepository
            .createQueryBuilder('promotional_codes')
            .select([
                'promotional_codes.id as id',
                'promotional_codes.code as code',
                'promotional_codes.month_value as month_value',
                'promotional_codes.user_label as user_label',
                'promotional_codes.claimed_at as claimed_at',
            ])
            .where('promotional_codes.claimed_at is not null')
            .getRawMany();

        let user_promo: any;
        for (let i = 0; i < codes.length; i++) {
            user_promo = await this.userSubscriptionRepository
                        .createQueryBuilder('user_subscription')
                        .select([
                            'user_subscription.user_label as user_label',
                            'user_subscription.order_id as code'
                        ])
                        .where('user_subscription.order_id = :code', { code: codes[i].code })
                        .getRawOne();
                        
            if(user_promo !== undefined) {
                let user_data = await this.userRepository
                                .createQueryBuilder('users')
                                .select([
                                    'users.email as email'
                                ])
                                .where('users.user_label = :label', {label: user_promo.user_label})
                                .getRawOne()
                if(user_data !== undefined) {
                    let current_label = user_promo.user_label;
                    await this.promotionalCodeRepository.update(
                        {code : codes[i].code }, 
                        {user_label : current_label}
                    );
                }
            }
        }
    }
}
