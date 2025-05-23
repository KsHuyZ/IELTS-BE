import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../utils/types/question.type';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePracticeListenTypeDto {
  @ApiProperty({ enum: Object.values(QuestionType) })
  @IsNotEmpty()
  @IsEnum(Object.values(QuestionType))
  type: QuestionType;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  practiceListenId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  limitAnswer?: number;
}
