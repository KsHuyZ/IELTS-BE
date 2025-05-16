import { ApiProperty } from '@nestjs/swagger';
import { ExamListenSection } from '../../exam-listen-sections/domain/exam-listen-section';
import { QuestionType } from '../../utils/types/question.type';

export class ExamListenType {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  examSection: ExamListenSection;

  @ApiProperty()
  content?: string;

  @ApiProperty()
  limitAnswer?: number;

  @ApiProperty()
  type: QuestionType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
