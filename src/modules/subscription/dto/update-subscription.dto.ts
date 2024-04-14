import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UpdateSubscriptionDto{
    @IsNotEmpty()
    @ApiProperty()
    readonly subscription_id : string;

    @IsNotEmpty()
    @ApiProperty()
    readonly price_id : string;
}