import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, BaseEntity } from 'typeorm'
import { v4 } from 'uuid';
import * as moment from 'moment'
import { Json } from 'aws-sdk/clients/robomaker';


@Entity(`${process.env.SCHEMA}.subscription_logs`)
export class SubscriptionLogsEntity extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    user_label: string;

    @Column()
    type: string;

    @Column()
    transaction_name: string;

    @Column()
    transaction_id: string;

    @Column()
    request_body: Json;

    @Column()
    response_body: Json;

    @Column()
    webhooks_url: string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    created_at : string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    updated_at : string;

    @Column()
    deleted_at : Date;

    @BeforeInsert()
    addId() {
        this.id = v4();
    }

    
    @BeforeUpdate()
    updatedDate() {
        this.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }



}

