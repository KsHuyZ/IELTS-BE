import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    type: String,
    required: true,
    format: 'binary',
  })
  image: Express.Multer.File;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

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
