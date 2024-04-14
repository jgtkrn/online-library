import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionService } from "./subscription.service";
import { UserSubscriptionEntity } from './entities/user-subscription.entity';
import { Logger } from '../../helpers/logger';
import * as moment from 'moment'
import { subscription_status, order_id_prefix, member_type } from '../../helpers/util';
import { UsersService } from '../users/users.service';


@Injectable()
export class CronSubscriptionService{
        constructor(
            private readonly userService : UsersService,
            private readonly subscriptionService : SubscriptionService,

            @InjectRepository(UserSubscriptionEntity)
            private userSubscriptionRepository : Repository<UserSubscriptionEntity>,
        ) {}

         // eslint-disable-next-line @typescript-eslint/ban-types
         async cronUpdateUserSubscriptionWhenExpired(){
            const now = moment().format('YYYY-MM-DD HH:mm:ss');

            const subs = await this.userSubscriptionRepository
            .createQueryBuilder('sub')
            .select([
                'sub._id as id',
                'sub._owner_id as owner_id',
                'sub.status as status',
                'sub.startdate as startdate',
                'sub.enddate as enddate',
                'sub.extra_enddate as extra_enddate',
                'sub.order_id as order_id',
                'sub.payment_id as payment_id'
            ])  
            .where('sub.status = :status', { status: subscription_status.ACTIVE})
            .andWhere('sub.enddate <= :now', {now: now})
            .getRawMany();

            Logger.info(`Query check activate user subscrioption executed in now ${now}`);
            // Logger.info(`Query check activate user subscrioption executed at ${new Date (now)}`);
    
            subs.map(async (subscription) => {
                    // Just Update user_subscription with stripe payment
                    // if((subscription.order_id.substring(0,3) == order_id_prefix.STRIPE || subscription.order_id.substring(0,8) == order_id_prefix.REFERRAL) && (subscription.extra_enddate <= new Date (now) || subscription.extra_enddate == null) ) {
                    if(subscription.extra_enddate <= new Date(now) || subscription.extra_enddate == null ) {
                        Logger.info(`Subscription with id ${subscription.order_id} and status ${subscription.status} expired on ${subscription.enddate}`);
                        await this.subscriptionService.inactiveSubscription(subscription.order_id);
                    }
            })
        }
    
        // eslint-disable-next-line @typescript-eslint/ban-types
        async cronUpdateMemberTypeWhenHaveNoActiveSubcription() : Promise<any> {
    
            const users = await this.userService.getUser(null, null)
                        .where('user.member_type = :member_type', { member_type: member_type.PAID})
                        .getRawMany();
    
            users.map(async(user) => { 
                    user.subs = await this.subscriptionService.getSubscriptionByUserLabel(user['label']);
                    if(user.subs.length < 1){
                        Logger.info(`User with email ${user.email} and id ${user.id} have no subscription active`);
                        await this.userService.updateMemberType(user.id, member_type.FREE)
                    }
                    return user
            })
    
        }
}