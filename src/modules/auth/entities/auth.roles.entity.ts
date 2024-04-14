import {Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(`${process.env.SCHEMA}._auth_role`)

export class AuthRoleEntity {

    @PrimaryGeneratedColumn("uuid")  
    auth_id: string;

    @Column()
    role_id: string;

}