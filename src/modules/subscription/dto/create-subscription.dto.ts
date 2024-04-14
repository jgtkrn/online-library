import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateSubscriptionDto{
    @IsNotEmpty()
    @ApiProperty()
    readonly paymentmethod_id : string;

    @IsNotEmpty()
    @ApiProperty()
    readonly customer_id : string;

    @IsNotEmpty()
    @ApiProperty()
    readonly price_id : string;

    @ApiProperty()
    readonly claim_trial: boolean;

    @ApiProperty()
    readonly referral_code : string;

    @ApiProperty()
    readonly promo_code: string;
}