import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn, Unique } from 'typeorm'

@Unique(['_id'])
export abstract class TableEntity {

    constructor (_database_id: string, _owner_id: string, _created_by: string) {
        this._owner_id = _owner_id
        this._database_id = _database_id
        this._created_by = _created_by
    }

    @PrimaryColumn({ type: 'text', default: () => `${process.env.SCHEMA}.uuid_generate_v4()::text` })
    _id: string

    @PrimaryColumn({ type: 'text' })
    _database_id: string

    @PrimaryColumn({ type: 'text' })
    _owner_id: string
    
    @Column({ type: 'jsonb', array: true, nullable: true })
    _access: string[]

    @CreateDateColumn({ name: '_created_at'})
    _created_at: Date

    @Column({ type: 'text' })
    _created_by: string

    @UpdateDateColumn({ name: '_updated_at'})
    _updated_at: Date

    @Column({ type: 'text', nullable: true })
    _updated_by: string

    @Column({ type: 'timestamp', nullable: true })
    deleted_at: Date

    @Column({ type: 'text', nullable: true })
    deleted_by: string
}