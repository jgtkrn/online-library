import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateCustomerDto{
    @IsNotEmpty()
    @ApiProperty()
    readonly email: string;
}