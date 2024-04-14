import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignStatusDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly active: boolean;
}