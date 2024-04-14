import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignBodyDto {
    @IsNotEmpty()
    @ApiProperty()
    readonly active: boolean;

    @ApiProperty()
    readonly title: string;

    @ApiProperty()
    readonly subtitle: string;

    @ApiProperty()
    readonly thumbnail: string;

    @ApiProperty({ example: ["2","3"] })
    readonly books: string[];

    @ApiProperty()
    readonly priority: number;
  }