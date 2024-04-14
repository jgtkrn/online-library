import { Entity, Column, BeforeInsert, PrimaryGeneratedColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'
import { v4 } from 'uuid';
import { new_language_code } from '../../../helpers/util';

@Entity(`${process.env.SCHEMA}.user`)
export class UserEntity {

    constructor (
        username: string, 
        email: string, 
        last_login_at: string, 
        firstname: string, 
        lastname: string, 
        birthday: Date,
        member_type: string, 
        deleted_at: Date, 
        deleted_by: string, 
        avatar: string,
        _database_id: string, 
        _owner_id: string, 
        _created_by: string,
        _created_at: string, 
        _updated_at:string, 
        apple_id: string, 
        social_login: string, 
        registration_platform : string,
        referral_code : string
    ) {
        // super(_database_id, _owner_id, _created_by)
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
        this.apple_id = apple_id
        this.social_login = social_login
        this.registration_platform = registration_platform
        this.referral_code = referral_code
        this._database_id = _database_id
        this._owner_id = _owner_id
        this._created_by = _created_by,
        this.language = new_language_code.CANTONESE
    }
    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id : string;

    @Column()
    _owner_id : string;

    @Column()
    _created_by : string;

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
    _created_at : string;

    @Column()
    _updated_at : string;

    @Column()
    user_label : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    avatar : string;

    @Column()
    referral_code : string;

    @Column()
    claim_referralcode : boolean;

    @Column()
    claim_freetrial : boolean;

    @Column()
    apple_id : string;

    @Column()
    social_login : string;

    @Column()
    registration_platform : string;

    @BeforeInsert()
	addId() {
        this._id = v4();
    }
}
