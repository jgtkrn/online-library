import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { TableEntity } from '../../app/entities'

@Entity(`${process.env.SCHEMA}.books_author`)
export class AuthorBookEntity extends TableEntity {

    constructor (author_label: string, book_label: string, _database_id: string, _owner_id: string, _created_by: string) {
        super(_database_id, _owner_id, _created_by)
        this.author_label = author_label
        this.book_label = book_label
    }

    @Column()
    author_label: string

    @Column()
    book_label: string
}
