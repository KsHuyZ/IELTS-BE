// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePracticeReadingTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ type: String, format: 'binary', required: false })
  image?: Express.Multer.File;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  limitAnswer?: number;
}
