import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class examDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
