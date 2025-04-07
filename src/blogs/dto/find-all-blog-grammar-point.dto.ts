import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindAllBlogGrammarPointDto {
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
  @IsMongoId()
  @IsOptional()
  grammarPointId?: string;
}
