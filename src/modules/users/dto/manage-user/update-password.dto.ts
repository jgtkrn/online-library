import { IsNotEmpty, MinLength} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class updatePassword {

    @IsNotEmpty()
    @ApiProperty()
    @MinLength(6)
    readonly new_password: string

}
