import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../utils/types/question.type';
import { PracticeListen } from '../../practice-listens/domain/practice-listen';

export class PracticeListenType {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  type: QuestionType;

  @ApiProperty()
  practiceListen: PracticeListen;

  @ApiProperty()
  content?: string;

  @ApiProperty()
  limitAnswer?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
