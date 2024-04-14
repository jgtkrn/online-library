import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class addFavDto {
    @ApiProperty()
    @ApiProperty({ example: ["investment","finance"] })
    label: string[];

  }
