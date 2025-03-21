import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateUserExamSpeakAnswerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  examSpeakId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  examId: string;

  @ApiProperty({
    type: String,
    format: 'binary',
  })
  answer: Express.Multer.File;
}
