import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCancelEndPeriodSubscribeDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly subscription_id: string;
}