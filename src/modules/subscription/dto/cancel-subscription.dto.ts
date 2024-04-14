import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CancelSubscriptionDto{
    @IsNotEmpty()
    @ApiProperty()
    readonly subscription_id: string;
}