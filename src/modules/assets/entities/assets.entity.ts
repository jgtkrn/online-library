import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';

@Entity(`${process.env.SCHEMA}._asset`)
export class AssetsEntity extends BaseEntity{
    @PrimaryColumn({ type: 'text' })
    id: string

    @Column({ type: 'text' })
    content_type: string

    @Column({ type: 'int8' })
    size : number
}