import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class myFavBookDto {
  @ApiProperty()
  @IsNotEmpty()
  book_label: string
}
export class myProgressDTo extends myFavBookDto {
  @ApiProperty()
  @IsNotEmpty()
  current_progress: number

  @ApiProperty()
  is_complete: boolean
}