import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../utils/types/question.type';

export class UpdateExamReadingTypeDto {
  @ApiProperty({ required: false, enum: Object.values(QuestionType) })
  @IsOptional()
  @IsEnum(Object.values(QuestionType))
  type: QuestionType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ type: String, format: 'binary', required: false })
  image?: Express.Multer.File;

  @ApiProperty()
  @IsOptional()
  @IsString()
  limitAnswer?: number;
}
