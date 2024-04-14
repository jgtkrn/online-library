import {Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(`${process.env.SCHEMA}.books_campaign`)
export class BooksCampaignEntity {

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id: string;

    @Column()
    _owner_id : string;

    @Column("text",{ array: true })
    _access : string[];

    @Column()
    _created_at : string;

    @Column()
    _updated_at : string;

    @Column()
    _created_by : string;

    @Column()
    _updated_by : string;

    @Column()
    deleted_at : Date;

    @Column()
    campaign_label : string;

    @Column()
    book_label : string;

    @Column()
    priority: number;

    @Column()
    deleted_by : string;
}