import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { v4 } from 'uuid';
import * as moment from 'moment'

@Entity(`${process.env.SCHEMA}.chapters`)
export class ChaptersEntity {

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
    deleted_by : string;

    @Column({
        unique: true,
        nullable: false,
        default: () => `nextval('${process.env.SCHEMA}.chapters_new_chapter_label_seq'::regclass)`,
        type: 'text' 
    })
    chapter_label : string;

    @Column()
    number : number;

    @Column()
    book_label : string;

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