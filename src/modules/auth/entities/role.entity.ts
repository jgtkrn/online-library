import {Entity, PrimaryGeneratedColumn, Column, BeforeInsert, JoinTable, ManyToMany, OneToMany , Generated} from 'typeorm';

@Entity(`${process.env.SCHEMA}._role`)

export class RoleEntity {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    by_default: string;

    @Column()
    is_admin: string;

}