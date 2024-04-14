import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty} from 'class-validator';

export class addFeedback {
    @IsNotEmpty()
    @ApiProperty()
    readonly description: string
}
