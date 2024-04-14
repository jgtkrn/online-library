interface PromotionalCode {
    id: string;
    code: string;
    month_value?: number;
    user_label?: string;
    claimed_at?: Date;
}

interface Pagination {
    size: number;
    page: number;
    total: number;
}

export interface PromotionalCodeList extends Pagination{
    promotionalcode: PromotionalCode[];
  }
  
