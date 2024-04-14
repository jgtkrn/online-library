import {Entity, PrimaryGeneratedColumn, Column , BeforeInsert, BeforeUpdate } from 'typeorm';
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.books`)
export class BookEntity {

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id: string;

    @Column()
    _owner_id : string;

    @Column("text",{ array: true })
    _access : string[];

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _created_at : string;

    @Column({  nullable: false,
        default: () => 'CURRENT_TIMESTAMP' ,
        type: 'timestamp',})
    _updated_at : string;

    @Column()
    _created_by : string;

    @Column()
    _updated_by : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    published_at : Date;

    @Column()
    published_by : string;

    @Column()
    popularity : number;

    @PrimaryGeneratedColumn("uuid")
    book_label: string

    @Column()
    cover_image : string;

    @Column()
    isbn : string;

    @Column()
    ref_link : string;

    @Column()
    status : string;

    @Column()
    note : string;

    @BeforeInsert()
	addId() {
		this._id = v4();
    }
    @BeforeInsert()
	now() {
        this._created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    
    @BeforeUpdate()
    updatedDate() {
        this._updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
    }


}