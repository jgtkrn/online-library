import { Author } from '../authors/authors.interface'

interface Book {
    id: string;
    title: string;
    label : string;
    author: string;
    cover_image: string;
    active: boolean;
}
interface Pagination {
    size: number;
    page: number;
    total: number;
}
interface Setting {
    label: string;
    cover_image: string;
    isbn: string;
    ref_link: string
}


interface Categories {
    id: number,
    name : string
}

export interface BookDetail {
    id: string;
    created_at : string;
    is_contain_audio: boolean;
    is_locked ?: boolean;
    status: string;
    audios ?: string[];
    authors ?: Author[];
    deleted_by ?: string;
    active: boolean;
    updated_at: string;
    label: string;
    cover_image: string;
    title: string;
    subtitle: string;
    author: string;
    introduction: string;
    duration: string;
    suitable_audience: string;
    categories: Categories;
}

export interface BooksList extends Pagination{
    books: Book[];
  }

export interface Books {
    books: Book[];
}
  
