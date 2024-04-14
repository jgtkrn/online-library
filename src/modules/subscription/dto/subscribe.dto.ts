import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly type: string;
    
    @ApiProperty()
    readonly card_number: string;

    @IsNotEmpty()
    @ApiProperty()
    readonly exp_month: number;

    @IsNotEmpty()
    @ApiProperty()
    readonly exp_year: number;

    @IsNotEmpty()
    @ApiProperty()
    readonly cvc: number;

    @IsNotEmpty()
    @ApiProperty()
    readonly plan_price_id: string;

    @ApiProperty()
    readonly referral_code: string;

    @ApiProperty()
    readonly promo_code: string;

    @ApiProperty()
    readonly claim_trial: boolean;
}