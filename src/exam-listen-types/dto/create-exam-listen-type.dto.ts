import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { QuestionType } from '../../utils/types/question.type';

export class CreateExamListenTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  examSectionId: string;

  @ApiProperty({
    enum: Object.values(QuestionType),
  })
  @IsNotEmpty()
  @IsEnum(Object.values(QuestionType))
  type: QuestionType;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  limitAnswer?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  content?: string;
}
