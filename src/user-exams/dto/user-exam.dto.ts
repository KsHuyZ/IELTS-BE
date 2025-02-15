import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserExamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
