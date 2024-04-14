import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';

import { userLang } from '../../helpers/app.helpers';
import { FeedbackEntity, UserEntity, UserTokenEntity } from './entities';
import { AuthEntity } from '../auth/entities';
import { User } from './users.interface';
import { Response } from '../../helpers/response';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository, getConnection} from 'typeorm';
import { EmailSender } from '../../helpers/email.sender';
import { token_type, token_status, unit_of_time, forget_pass, member_type, subscription_status, registration_platform, payment_method, payment_status } from '../../helpers/util';
import * as moment from 'moment-timezone';
import * as ejs from 'ejs';
import { updateUser } from './dto';
import { Logger } from '../../helpers/logger';
import { UserSubscriptionEntity } from '../subscription/entities/user-subscription.entity';
import { SubscriptionPlanEntity } from '../subscription/entities/subscription-plan.entity';
import { UserInterestEntity } from '../categories/entities';
import { ExportFile } from '../../helpers/export-file';
import { UserPaymentEntity } from '../subscription/entities/user-payment.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {

    constructor(

        private readonly response: Response,
        private readonly emailSender: EmailSender,
        private readonly i18n: I18nService,
        private readonly exportFile: ExportFile,

        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,

        @InjectRepository(AuthEntity)
        private authEntityRepository: Repository<AuthEntity>,

        @InjectRepository(UserInterestEntity)
        private userInterestRepository: Repository<UserInterestEntity>,

        @InjectRepository(UserPaymentEntity)
        private userPaymentRepository: Repository<UserPaymentEntity>,
      ) {};

    getUser(id, email, additionalSelect = null, appleId = null) {
      
        const select = [
            'user._id as id', 
            'user.firstname as first_name', 
            'user.email as email',
            'user.lastname as last_name', 
            'user.member_type as member_type',
            'user.language as language', 
            'user.user_label as label', 
            'user.avatar as avatar', 
            'user.language as language', 
            'user.last_login_at as last_login_at', 
            'user._created_at as created_at',
            'user.deleted_at as deleted_at',
            `"user"."apple_id" as apple_id`, 
            `"user"."referral_code" as referral_code`,
            `"user".claim_freetrial as claim_freetrial`,
            `"user".claim_referralcode as claim_referralcode`,
        ]
        if ( additionalSelect ) Array.prototype.push.apply(select, additionalSelect)

        let user = this.userRepository
        .createQueryBuilder("user")
        .select(select)

        if(email) user = user.where('user.email = :email', { email })
        if(appleId && email){
            user =  user.where(`"user"."apple_id" = :appleId`, { appleId })
                .orWhere('user.email = :email', { email })
            }
        if(id) user = user.where('user._id = :id', { id })

        return user;
    }

    async findOne(id, email): Promise<User> {
        return await this.getUser(id, email)
        .getRawOne()
    }

    async addUser(user, socialLogin = null, registration_platform = null): Promise<void> {
            
        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
   
            const addUser: UserEntity = new UserEntity( 
                user.username ? user.username : user.email,
                user.email, 
                moment().local().format(),
                user.first_name, 
                user.last_name, 
                null, 
                user.user_type, 
                null, 
                null, 
                user.avatar ? user.avatar : null, 
                '',
                '', 
                null, 
                moment().tz('Hongkong').format(), moment().tz('Hongkong').format(), 
                user.apple_id ? user.apple_id : null, 
                socialLogin,
                registration_platform,
                await this.generateReferralCode(socialLogin == 'apple' ? false : true) 
            );
            
            const userData =  await queryRunner.manager.save(addUser);

            const authUser: AuthEntity = new AuthEntity()
            authUser.id = userData._id
            authUser.token_valid_since = moment().local().format()
            authUser.disabled = false
            authUser.password = user.password

            const ownerId = {
                _owner_id : userData._id,
                _created_by: userData._id,
            }

            await queryRunner.manager.save(authUser);

            await queryRunner.manager.update(UserEntity, { _id: userData._id }, ownerId );  

            await queryRunner.commitTransaction();
        
        }catch(err) {
            await queryRunner.rollbackTransaction();
            Logger.error(`failed to create user : ${user.email}`, {email: user.email, error : err, socialLogin} );
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
        finally {
            await queryRunner.release();
        }
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    async updateUser(userData : updateUser, user) : Promise<void>{

        const oldData = await this.getUser(user.sub, null, ['user.birthday as birthday']).getRawOne();

        const requestData = {
            firstname : !userData['firstname'] || userData['firstname'] == "" ? oldData['first_name'] : userData['firstname'] ,
            lastname : !userData['lastname'] || userData['lastname'] == "" ? oldData['last_name'] : userData['lastname'] ,
            avatar : !userData['avatar'] || userData['avatar'] == "" ? oldData['avatar'] : userData['avatar'] ,
            language : !userData['language'] || userData['language'] == "" ? oldData['language'] : userData['language'] ,
            birthday : !userData['birthday'] || userData['birthday'].toString() == "" ? oldData['birthday'] : userData['birthday'],
            last_login_at : !userData['last_login_at'] || userData['last_login_at'].toString() == "" ? oldData['last_login_at'] : userData['last_login_at'],
            _updated_at : moment().format('YYYY-MM-DD HH:mm:ss'),
        }

        try {
            await this.userRepository.update({ _id: user.sub }, requestData)
        } catch(error) {
            Logger.error( `invalid update usser, ${error}`, userData);
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }

    }

    async updatePassWord(passwordData, user): Promise<void> {

        const authData = { password:  await bcrypt.hashSync(passwordData.new_password, Number(10)) }
        try {
            const userId = user.sub ?? user.id;
            await this.authEntityRepository.update( { id: userId }, authData )
        } catch(error){
            Logger.error( `invalid reset password, ${user.userId, error},`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const err = [{ "reset-password" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async createNewUser (userData): Promise<void> {
        if(userData.registration_platform && !Object.values(registration_platform).includes(userData.registration_platform)){
            Logger.error(`Invalid platform selected, platform must be ios, android, or website`);
            const err = [{ "register" : 'Invalid platform selected, platform must be ios, android, or website' }];
            throw new HttpException(await this.response.response('Invalid platform selected, platform must be ios, android, or website', null, err), HttpStatus.BAD_REQUEST); 
        }

        const user = await this.getUser(null, userData.email)
        .getRawOne();

        if (user && user.apple_id) {
            Logger.error(`user already exist registered by SSO apple: ${userData.email}`);
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.USER.USER_REGISTERED_ON_SSO', { lang: await userLang(user) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            ) 
        }
        if(user) {
            Logger.error(`user already exist: ${userData.email}`);
            throw new HttpException(await this.response.response(  
                await this.i18n.translate('message.USER.USER_REGISTERED', { lang: await userLang(user) }), 
                null, null), HttpStatus.INTERNAL_SERVER_ERROR
            ) 
        }
        await this.addUser(userData, null, userData.registration_platform)
    }

    async resetPassword(passwordData, user): Promise<void> {
       
        const users = await this.getUser(user.sub, null)
        .select(['auth.password', 'user.email', 'user._id as id'])
        .innerJoin( AuthEntity, 'auth', 'auth.id = user._id')
        .getRawOne();

        if(!users) {
            Logger.error(`user is not exist: ${user.sub}`);
            const message =  await this.i18n.translate('message.USER.USER_NOT_FOUND', { lang: await userLang(user) })
            const err = [{ "reset-password" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.NOT_FOUND
            )
        }

        const pass = await bcrypt.compareSync(passwordData.old_password, users.auth_password)

        if (!pass) {
            Logger.error( `password inserted is wrong: ${user.sub}`);
            const message =  await this.i18n.translate('message.USER.INCORRECT_PASSWORD', { lang: await userLang(user) })
            const err = [{ "reset-password" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.BAD_REQUEST
            )
        }

        await this.updatePassWord(passwordData, user)

    }

    async forgetPassword(userData) {

        const after30min = moment().add(unit_of_time.half_hour, 'minutes').format()
        const user = await this.getUser(null, userData.email).getRawOne()
        if (user && user.apple_id) {
            Logger.error(`user registered by SSO apple, cant reset password, email: ${userData.email}`);
            throw new HttpException(await this.response.response('Failed to Process Forget Password, User Registered Using SSO', null, null), HttpStatus.BAD_REQUEST); 
        }
        
        if(!user) {
            Logger.error(`user not found: ${userData.email}`);
            const err = [{ "forget-password" : 'User Not Registered' }];
            throw new HttpException(await this.response.response('沒有此電郵的帳戶', null, null), HttpStatus.NOT_FOUND); 
        }
        // let token = await bcrypt.hashSync(userData.email, Number(10))
        const token = randomBytes(40).toString('hex');

        const date = new Date();

        const dataUser = {
            redirect_uri: `${process.env.RESET_PASSWORD_URI}/?code=${token}`,
        }
        
        const template = await ejs.renderFile(__dirname + "/templates/forget-password.ejs", { dataUser })
        const emailData = {
            receiver : userData.email,
            subject: forget_pass.email_subject,
            text: null,
            template
        }
        const userToken = new UserTokenEntity()
        userToken.user_id = user.id
        userToken.expired_at = moment(after30min).utc().toISOString()
        userToken.token = token
        userToken.type = token_type.RESET_PASSWORD

        try {
            await userToken.save();
            await this.emailSender.send(emailData);
        } catch (err) {
            Logger.error(`failed to processing forget password , error:${err}`,userData);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(user) })
            const error = [{ "forget-password" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, error), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }
    async addLastLoginAt(id) : Promise<void>{
        const user = { 
            last_login_at : moment().tz('Hongkong').format()
        }
        await this.userRepository.update(
            { _id: id } , user
          );
    }

    async verifyToken(token): Promise<object> {

        const userToken = await UserTokenEntity
            .createQueryBuilder("token")
            .select(['token.id as token_id', 'token as token', 'expired_at as expired_at', 'user._id as sub'])
            .innerJoin(UserEntity, 'user', 'token.user_id = user._id')
            .where('token.token = :token', { token })
            .andWhere('token.expired_at > :now', { now: moment().local().format() })
            .andWhere('token.type = :type', { type: token_type.RESET_PASSWORD })
            .andWhere('token.status = :status', {status: token_status.VALID })
            .getRawOne()

            if (!userToken) {
                Logger.error(`Token is Not Found or Expired`, { token });
                const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
                const error = [{ "verify-token" : message }];
                throw new HttpException(await this.response.response(  
                    message,
                    null, error), HttpStatus.INTERNAL_SERVER_ERROR
                )
            } else {
                return userToken
            }
        }

    async confirmPassword(userData): Promise<void>{
        const token = encodeURIComponent(userData.token)
        const userToken = await this.verifyToken(token)

        try{
            await this.updatePassWord(userData, userToken)

            await UserTokenEntity.update(
                { id: (userToken as any).token_id } , 
                { status: token_status.INVALID }
            );

        }catch (err) {
            Logger.error(`failed to processing confirm password ,error:${err}`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const error = [{ "confirm-password" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, error), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }   

    async updateStripeId(data, stripeId): Promise<void> {
        try {
            await this.authEntityRepository.update({id: data.id}, { stripe_id: stripeId })
        } catch(error){
            Logger.info('invalid update strip id', {data, stripeId});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "stripe-id" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async updateMemberType(userId : string, type : member_type): Promise<void> {
        try {
            await this.userRepository.update({ _id: userId }, { member_type : type, _updated_at : moment().local().format()});
            Logger.info(`Successfully update user member_type with id ${userId}`);
        } catch(error){
            Logger.error( `Failed to update member type ${userId}, ${error}`, type);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "update-member-type" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async isFreeTrialClaimed(userId : string): Promise<boolean> {
        const additionalSelect = [ 'user.claim_freetrial as claim_freetrial']
        const user = await this.getUser(userId, null, additionalSelect)
        .getRawOne();

        return user['claim_freetrial'];
    }

    async isReferralCodeClaimed(userId : string): Promise<boolean> {
        const additionalSelect = [ 'user.claim_referralcode as claim_referralcode']
        const user = await this.getUser(userId, null, additionalSelect)
        .getRawOne();

        return user['claim_referralcode'];
    }

    async updateFreeTrial(userId : string, claim_freetrial : boolean): Promise<void> {
        try {
            await this.userRepository.update({ _id: userId }, { claim_freetrial : claim_freetrial, _updated_at : moment().local().format()});
            Logger.info(`Successfully update user claim_freetrial with id ${userId}`);
        } catch(error){
            Logger.error( `Failed to update user claim_freetrial with id ${userId}, ${error}`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "update-member-type" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async updateReferralCodeStatus(userId : string, claim_referralcode : boolean): Promise<void> {
        try {
            await this.userRepository.update({ _id: userId }, { claim_referralcode : claim_referralcode, _updated_at : moment().local().format()});
            Logger.info(`Successfully update user claim_referralcode with id ${userId}`);
        } catch(error){
            Logger.error( `Failed to update user claim_referralcode with id ${userId}, ${error}`);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "update-member-type" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getUserByReferralCode(referral_code : string) : Promise<Object>{
        const user = await this.userRepository
        .createQueryBuilder("user")
        .leftJoin(UserSubscriptionEntity,'user_subscription','user_subscription.user_label = user.user_label')
        .select([
            'user._id as id', 
            'user.firstname as first_name', 
            'user.email as email',
            'user.lastname as last_name', 
            'user.member_type as member_type',
            'user.user_label as user_label',
            'user.referral_code as referral_code',
            'user.claim_referralcode as claim_referralcode',
            'user.claim_freetrial as claim_freetrial',
            `array_agg(DISTINCT jsonb_build_object(
                    'user_label', user_subscription.user_label,
                    'order_id', user_subscription.order_id,
                    'startdate', user_subscription.startdate,
                    'enddate', user_subscription.enddate,
                    'extra_enddate', user_subscription.extra_enddate,
                    'is_referral_bonus_claimed', user_subscription.is_referral_bonus_claimed,
                    'status', user_subscription.status,
                    'created_at', user_subscription._created_at
                )
            ) AS user_subscriptions`,
        ])
        .where('user.referral_code = :referral_code', { referral_code })
        .groupBy(
        `user._id,
         user.firstname,
         user.email,
         user.lastname,
         user.member_type,
         user.user_label,
         user.referral_code,
         user.claim_referralcode,
         user.claim_freetrial
        `).getRawOne();

        const user_subscriptions = []
        if(user) {
            await user.user_subscriptions.map((user_subscription)=>{
                if( user_subscription.order_id !== null && user_subscription.status == subscription_status.ACTIVE ) {
                    user_subscriptions.push(user_subscription)
                }
            });
            user.user_subscriptions = user_subscriptions.sort(function (a, b) {
                const paramsA = new Date(a.enddate).getTime() > new Date(a.extra_enddate).getTime() ? new Date(a.enddate).getTime() : new Date(a.extra_enddate).getTime();
                const paramsB = new Date(b.enddate).getTime() > new Date(b.extra_enddate).getTime() ? new Date(b.enddate).getTime() : new Date(b.extra_enddate).getTime();
                return paramsB - paramsA;
              });;
        }

        return user;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getUserWithSubscription(userId, additionalSelect = null): Promise<Object>{
        const select = [  
            `json_agg(DISTINCT jsonb_build_object(
                'user_label', userSubscription.user_label,
                'order_id', userSubscription.order_id,
                'subscription_ref_code', userSubscription.subscription_ref_code,
                'subscription_type', subscriptionplan.subscription_type,
                'startdate', userSubscription.startdate,
                'enddate', userSubscription.enddate,
                'extra_enddate', userSubscription.extra_enddate,
                'status', userSubscription.status,
                'created_at', userSubscription._created_at
                )
            ) AS user_subscriptions` ]  

            if ( additionalSelect ) Array.prototype.push.apply(select, additionalSelect)
            const data = await this.getUser(userId, null, select)
               .leftJoin(UserSubscriptionEntity, 'userSubscription', 'userSubscription.user_label = user.user_label AND userSubscription.status = :status', {status:subscription_status.ACTIVE})
               .leftJoin(SubscriptionPlanEntity, 'subscriptionplan', 'subscriptionplan.ref_code = userSubscription.subscription_ref_code')
               .groupBy(
               `user._id, 
                user.firstname, 
                user.email,
                user.lastname, 
                user.member_type,
                user.language, 
                user.user_label, 
                user.avatar, 
                user.language, 
                user.last_login_at, 
                user._created_at,
                user.apple_id, 
                user.referral_code,
                user.claim_freetrial,
                user.claim_referralcode,
                user.birthday,
                user.deleted_at 
                `)
               .getRawOne();

        const subscription = data.user_subscriptions.sort(function (a, b) {
               const paramsA = new Date(a.enddate).getTime() > new Date(a.extra_enddate).getTime() ? new Date(a.enddate).getTime() : new Date(a.extra_enddate).getTime();
               const paramsB = new Date(b.enddate).getTime() > new Date(b.extra_enddate).getTime() ? new Date(b.enddate).getTime() : new Date(b.extra_enddate).getTime();
               return paramsB - paramsA;
        });   
    
        data.user_subscriptions = subscription
        return data;

    }

    async updateAppleId(appleId, id): Promise<void> {
        try {
            await getConnection()
            .createQueryBuilder()
            .update(UserEntity)
            .set({ apple_id: appleId})
            .where("_id = :id", { id })
            .execute();
        } catch(error){
            Logger.error( `invalid update apple_id, ${error},`, {id});
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const err = [{ "apple_id" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, err), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async addFeedback(userId : string, description : string) {
        try{
            const feedback = new FeedbackEntity()
            feedback.user_id = userId
            feedback.description = description
        
            await feedback.save();
    
        } catch (err) {
            Logger.error(`Failed to create feedback, userId: ${userId}, error:${err}`, description);
            const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
            const error = [{ "AddFeedback" : message }];
            throw new HttpException(await this.response.response(  
                message,
                null, error), HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getInterestByUserLabel(user_label):Promise<Object> {
        const data = await this.userInterestRepository
        .createQueryBuilder("interest")
        .select(['interest.category_label as label'])
        .where('interest.user_label = :userLabel', { userLabel: user_label })
        .getRawMany()

        const interests = [];

        await data.map(async(interest) => { 
            interests.push(interest.label);
        })

        return interests;
    }

        // eslint-disable-next-line @typescript-eslint/ban-types
    async getExportDataUser(): Promise<Object> {            
            const users = await this.userRepository
            .createQueryBuilder("user")
            .where('user.deleted_at IS NULL')
            .leftJoin(UserSubscriptionEntity,'user_subs','user_subs.user_label = user.user_label')
            .leftJoin(SubscriptionPlanEntity, 'plan','plan.ref_code = user_subs.subscription_ref_code')
            .select([
                'user._id as id', 
                'user.firstname as first_name', 
                'user.lastname as last_name', 
                'user.email as email',
                'user.registration_platform as registration_platform',
                'user.last_login_at as last_login_at', 
                'user.referral_code as referral_code',
                'user.member_type as member_type',
                'user.user_label as label',
                'user._created_at as created_at',
                `json_agg(DISTINCT jsonb_build_object(
                    'user_label', user_subs.user_label,
                    'order_id', user_subs.order_id,
                    'startdate', user_subs.startdate,
                    'enddate', user_subs.enddate,
                    'extra_enddate', user_subs.extra_enddate,
                    'status', user_subs.status,
                    'ref_code', user_subs.subscription_ref_code,
                    'subscription_plan', plan.subscription_type,
                    'created_at', user_subs._created_at
                )
            ) AS user_subscriptions`,
            ])
            .groupBy(
                `user._id,
                 user.firstname,
                 user.lastname,
                 user.email,
                 user.registration_platform,
                 user.last_login_at,
                 user.referral_code,
                 user.claim_referralcode,
                 user.member_type,
                 user.user_label,
                 user._created_at
            `)
            .orderBy('user._created_at', 'ASC')
            .getRawMany();
            // return users;
            
            const data = [];

            await users.map(async(el) => {
                el.user_subscriptions.sort(function (a, b) {
                    const paramsA = new Date(a.enddate).getTime() > new Date(a.extra_enddate).getTime() ? new Date(a.enddate).getTime() : new Date(a.extra_enddate).getTime();
                    const paramsB = new Date(b.enddate).getTime() > new Date(b.extra_enddate).getTime() ? new Date(b.enddate).getTime() : new Date(b.extra_enddate).getTime();
                    return paramsB - paramsA;
                  });   

                const user = {
                    id: el.id,
                    first_name: el.first_name,
                    last_name: el.last_name,
                    email: el.email,
                    registration_platform : el.registration_platform,
                    last_login_at : el.last_login_at ? moment(el.last_login_at).format("YYYY-MM-DD HH:mm:ss") : null,
                    referral_code : el.referral_code,
                    // referral_histories : histories[0].code ? histories : null,
                    member_type : el.member_type,
                    label : el.label,
                    order_id : el.user_subscriptions[0]['order_id'] ? "'" + el.user_subscriptions[0]['order_id'] : null,
                    created_at :el.created_at ? moment(el.created_at).format("YYYY-MM-DD HH:mm:ss") : null,
                    subscription_status : el.user_subscriptions[0]['status'],
                    startdate : el.user_subscriptions[0]['startdate'] ? moment(el.user_subscriptions[0]['startdate']).format("YYYY-MM-DD HH:mm:ss") : null,
                    enddate : el.user_subscriptions[0]['enddate'] ? moment(el.user_subscriptions[0]['enddate']).format("YYYY-MM-DD HH:mm:ss") : null,
                    plan : el.user_subscriptions[0]['subscription_plan'],
                    extra_enddate : el.user_subscriptions[0]['extra_enddate'] ? moment(el.user_subscriptions[0]['extra_enddate']).format("YYYY-MM-DD HH:mm:ss") : null,
                }

                data.push(user);
            })

            return data;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async exportCsv(res){
        const fields = [
            {
              label: 'Email Address',
              value: 'email'
            },
            {
              label: 'First Name',
              value: 'first_name'
            },
            {
              label: 'Last Name',
              value: 'last_name'
            },
            {
             label: 'Member Type',
              value: 'member_type'
            },
            {
             label: 'User Label',
              value: 'label'
            },
            {
             label: 'Subscription Status',
              value: 'subscription_status'
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
             label: 'Plan',
              value: 'plan'
            },
            {
             label: 'Order ID',
              value: 'order_id'
            },
            {
             label: 'Extra End Date',
              value: 'extra_enddate'
            },
            {
             label: 'Referral Code',
              value: 'referral_code'
            },
            {
             label: 'Registration Platform',
              value: 'registration_platform'
            },
            {
             label: 'Registration Date',
              value: 'created_at'
            },
            {
             label: 'Last Login',
              value: 'last_login_at'
            }
          ];

        const data = await this.getExportDataUser();
        const time = moment().tz('Hongkong').format('YYYYMMDDHHmmss');
        return this.exportFile.csv(res, 'users_'+time+'.csv', fields, data);
    }

    async isUserUniqueValidationPassed(email : string, username : string):  Promise<any> {
        let user = this.userRepository
        .createQueryBuilder("user")
        .select([
            'user._id as id', 
            'user.username as username', 
            'user.email as email',
        ])

        if(email) user = user.where('user.email = :email', { email })

        if(username) user = user.where('user.username = :username', { username })

        const data = await user.getRawOne();

        return !data ? true : false;
    }

    async generateReferralCode(check = true): Promise<string>{
        let result = '';
        const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;
        for ( let i = 0; i < 6; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        if(check){
            Logger.info(`Checking availability referral code : ${result}`);
            const isReferralCodeAvailabe = await this.isReferralCodeAvailabe(result);
            if(!isReferralCodeAvailabe) {
                    Logger.error(`Duplicate referral code generated :${result}`);
                    return this.generateReferralCode();
            } 
        }

        return result;
    }

    async isReferralCodeAvailabe(code : string):  Promise<boolean> {
        const data = await this.userRepository
        .createQueryBuilder("user")
        .select([
            'user._id as id', 
            'user.username as username', 
            'user.referral_code as referral_code',
        ])
        .where('user.referral_code = :code', { code })
        .getRawOne();

        return !data ? true : false;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async checkUserByReferralCode(referral_code : string, userId : string) : Promise<Object>{
        const data = await this.userRepository
        .createQueryBuilder("user")
        .select([
            'user._id as id', 
            'user.firstname as first_name', 
            'user.email as email',
            'user.lastname as last_name', 
            'user.member_type as member_type',
            'user.user_label as user_label',
            'user.referral_code as referral_code',
        ])
        .where('user.referral_code = :referral_code', { referral_code })
        .getRawOne();
        
        let valid = false;
        let message = 'Referral code invalid';

        if(data){

            if(data.id != userId){
                const existing_payment = await this.getPaidPaymentByUser(userId);
                if(existing_payment.length > 0){
                    message = 'Referral code offer is only applicable to new users';
                } else {
                    valid = true;
                    message = 'Referral code is valid';
                }
            } else {
                message = 'Cannot claim your own referral code';
            }
        }

        return {
            valid : valid,
            code : referral_code,
            message : message
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    async getPaidPaymentByUser(user_id : string): Promise<any> {
        const data = await this.userPaymentRepository
        .createQueryBuilder('user_payment')
        .select([
            'user_payment._id as id', 
            'user_payment.user_label as user_label',
            'user_payment._owner_id as user_id',
            'user_payment.subscription_ref_code as ref_code',
            'user_payment.paid_fee as paid_fee',
            'user_payment.status as status',
            'user_payment.currency as currency',
            'user_payment.transaction_id as transaction_id',
            'user_payment.original_transaction_id as original_transaction_id',
        ])
        .where('user_payment._owner_id = :user_id', { user_id: user_id })  
        .andWhere('user_payment.status = :status', { status: payment_status.PAID })
        .getRawMany();

        return data;
    }

    // async updateFormatReferralCode(){
    //     const users = await this.getUser(null, null, null).getRawMany();
    //     // return users;

    //     for await(const user of users){
    //         try {
    //             const code = await this.generateReferralCode()
    //             await this.userRepository.update({ _id: user.id }, { referral_code : code});
    //             Logger.info(`Successfully update user referralcode with id ${user.id} to ${code}`);
    //         } catch(error){
    //             Logger.error( `Failed to update user referralcode with id ${user.id}, ${error}`);
    //             const message =  await this.i18n.translate('message.GENERAL.ERROR.SERVER_ERROR', { lang: await userLang(null) })
    //             const err = [{ "update-referral-code" : message }];
    //             throw new HttpException(await this.response.response(  
    //                 message,
    //                 null, err), HttpStatus.INTERNAL_SERVER_ERROR
    //             )
    //         }
    //     }

    //     return 'Done';
    // }
}
 