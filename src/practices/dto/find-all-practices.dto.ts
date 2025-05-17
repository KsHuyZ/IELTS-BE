import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExamStatus } from '../../exams/exams.type';
import { QuestionType } from '../../utils/types/question.type';
import { PracticeType } from '../pratices.type';

export class FindAllPracticesDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Object.values(ExamStatus))
  status?: ExamStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Object.values(PracticeType))
  type?: PracticeType;

  @ApiPropertyOptional({
    enum: Object.values(QuestionType),
  })
  @IsOptional()
  @IsEnum(Object.values(QuestionType))
  questionType?: QuestionType;
}
