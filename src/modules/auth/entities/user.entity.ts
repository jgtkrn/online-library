import { Entity, Column, BeforeInsert, PrimaryGeneratedColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'
import { v4 } from 'uuid';

@Entity(`${process.env.SCHEMA}.user`)
export class UserEntity extends TableEntity {

    constructor (username: string, email: string, last_login_at: string, 
                firstname: string, lastname: string, birthday: Date,
                member_type: string, deleted_at: Date, deleted_by: string, avatar: string,
                _database_id: string, _owner_id: string, _created_by: string,
                 _created_at: Date, _updated_at:Date ) {
        super(_database_id, _owner_id, _created_by)
        this.username = username
        this.email = email
        this.last_login_at = last_login_at
        this.firstname = firstname
        this.lastname = lastname
        this.birthday = birthday
        this.member_type = member_type
        this.deleted_at = deleted_at
        this.deleted_by = deleted_by
        this.avatar = avatar
        this._created_at = _created_at
        this._updated_at = _updated_at
    }
    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    username : string;

    @Column()
    email : string;

    @Column()
    last_login_at : string;

    @Column()
    firstname : string;

    @Column()
    lastname : string;

    @Column()
    birthday : Date;

    @Column()
    member_type : string;

    @Column()
    language : string;

    @Column()
    _created_at : Date;

    @Column()
    _updated_at : Date;

    @Column()
    user_label : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    avatar : string;

    @BeforeInsert()
	addId() {
		this._id = v4();
    }
}
