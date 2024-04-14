import { ApiProperty } from '@nestjs/swagger';

export class VerifyPurchaseDto {
    @ApiProperty()
    readonly receipt: string;

    @ApiProperty({ default: 'HK' })
    readonly region: string;
}
