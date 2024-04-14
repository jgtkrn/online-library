import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, BaseEntity } from 'typeorm'
import { v4 } from 'uuid';
import * as moment from 'moment'
import { Json } from 'aws-sdk/clients/robomaker';
import { float } from 'aws-sdk/clients/lightsail';


@Entity(`${process.env.SCHEMA}.user_subscription`)
export class UserSubscriptionEntity extends BaseEntity{

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id: string;

    @Column()
    _owner_id: string;

    @Column()
    _access: Json;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _created_at : string;

    @Column()
    _created_by: string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _updated_at : string;

    @Column()
    _updated_by: string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by: string;

    @Column()
    startdate : Date;

    @Column()
    enddate : Date;

    @Column()
    subscription_ref_code: string;

    @Column()
    original_fee: float;

    @Column()
    currency: string;

    @Column()
    user_label: string;

    @Column()
    order_id: string;

    @Column()
    purchase_token: string;

    @Column()
    status: string;

    @Column()
    payment_id: string;

    @Column()
    extra_enddate : Date;

    @Column()
    referral_code: string;

    @Column()
    is_referral_bonus_claimed : boolean;

    @BeforeInsert()
    addId() {
        this._id = v4();
        this._created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }

    
    @BeforeUpdate()
    updatedDate() {
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }



}

