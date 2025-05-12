import { ApiProperty } from '@nestjs/swagger';

export class UpdateExamSpeakQuestionDto {
  @ApiProperty({ type: String, format: 'binary' })
  question: Express.Multer.File;
}
