import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class isAdmin {
    @ApiProperty()
    readonly isAdmin: boolean;

    @ApiProperty()
    readonly interest: boolean;

  }