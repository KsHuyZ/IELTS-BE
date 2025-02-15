import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ExamType } from '../exams.type';

export class FindAllExamsDto {
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

  @ApiPropertyOptional({
    enum: ExamType,
    example: ExamType.Listening,
  })
  @IsEnum([
    ExamType.Listening,
    ExamType.Reading,
    ExamType.Speaking,
    ExamType.Writing,
  ])
  @IsOptional()
  type?: ExamType;
}
