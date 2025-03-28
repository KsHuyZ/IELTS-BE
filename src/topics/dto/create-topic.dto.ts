import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}
