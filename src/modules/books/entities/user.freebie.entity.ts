import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.user_freebie_books`)
export class UserFreebieBooksEntity extends TableEntity {

    constructor (book_label: string, free_assign_date: Date, is_assigning: boolean, user_label: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.book_label = book_label
        this.free_assign_date = free_assign_date
        this.is_assigning = is_assigning
        this.user_label = user_label
    }

    @Column()
    book_label: string

    @Column()
    free_assign_date: Date

    @Column()
    is_assigning: boolean

    @Column()
    is_complete: boolean

    @Column()
    user_label: string
}
