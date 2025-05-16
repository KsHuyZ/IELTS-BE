import { ApiProperty } from '@nestjs/swagger';
import { ExamPassage } from '../../exam-passages/domain/exam-passage';
import { QuestionType } from '../../utils/types/question.type';

export class ExamReadingType {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  examPassage: ExamPassage;

  @ApiProperty()
  type: QuestionType;

  @ApiProperty()
  content?: string;

  @ApiProperty()
  limitAnswer?: number;
  @ApiProperty()
  image?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
