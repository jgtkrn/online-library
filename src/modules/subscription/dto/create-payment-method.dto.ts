import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreatePaymentMethodDto{
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
}