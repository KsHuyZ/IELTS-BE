import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { QuestionType } from '../../utils/types/question.type';

export class CreateExamReadingTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  examPassageId: string;

  @ApiProperty()
  @IsNotEmpty()
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
