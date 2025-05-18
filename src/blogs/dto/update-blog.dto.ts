import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateBlogDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    type: String,
    required: false,
    format: 'binary',
  })
  image?: Express.Multer.File;

  @ApiProperty()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  topicId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  grammarPointId?: string;
}
