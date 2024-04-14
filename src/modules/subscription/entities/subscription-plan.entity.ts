import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate } from 'typeorm'
import { v4 } from 'uuid';
import * as moment from 'moment'
import { float } from 'aws-sdk/clients/lightsail';


@Entity(`${process.env.SCHEMA}.subscription_plan`)
export class SubscriptionPlanEntity {

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    title: string;

    @Column()
    subscription_fee: float;

    @Column()
    currency: string;

    @Column()
    price_tag: string;

    @Column()
    subscription_type: string;

    @Column()
    description: string;

    @Column()
    ref_code: string;

    @Column()
    stripe_id: string;

    @Column()
    sequence: number;

    @Column()
    badge: string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _created_at : string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _updated_at : string;

    @Column()
    deleted_at : Date;

    @BeforeInsert()
    addId() {
        this._id = v4();
    }

    
    @BeforeUpdate()
    updatedDate() {
        this._created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }

}

