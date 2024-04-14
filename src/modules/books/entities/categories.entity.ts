import {Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(`${process.env.SCHEMA}.categories`)
export class CategoriesEntity {

    @PrimaryGeneratedColumn("uuid")
    _id: string;

    @Column()
    _database_id: string;

    @Column()
    _owner_id : string;

    @Column("text",{ array: true })
    _access : string[];

    @Column()
    _created_at : Date;

    @Column()
    _created_by : string;

    @Column()
    _updated_by : string;

    @Column()
    deleted_at : Date;

    @Column()
    deleted_by : string;

    @Column()
    category_label : string;

    @Column()
    thumbnail : string;
}