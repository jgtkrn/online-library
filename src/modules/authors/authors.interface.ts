export interface Author {
    id: number;
    name: string;
    label: string;
    book_on_apps: string;
}
interface Pagination {
    limit: number;
    size: number;
    offset: number;
    total: number;
}

export interface AuthorList extends Pagination{
    data: Author[];
  }
  
