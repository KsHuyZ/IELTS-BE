import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
} from '@nestjs/common';
import { ExamSpeakQuestionsService } from './exam-speak-questions.service';
import { CreateExamSpeakQuestionDto } from './dto/create-exam-speak-question.dto';
import { ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ExamSpeakQuestion } from './domain/exam-speak-question';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Examspeakquestions')
@Controller({
  path: 'exam-speak-questions',
  version: '1',
})
export class ExamSpeakQuestionsController {
  constructor(
    private readonly examSpeakQuestionsService: ExamSpeakQuestionsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: ExamSpeakQuestion,
  })
  @UseInterceptors(FileInterceptor('question'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createExamSpeakQuestionDto: CreateExamSpeakQuestionDto,
    @UploadedFile()
    question: Express.Multer.File,
  ) {
    return this.examSpeakQuestionsService.create({
      ...createExamSpeakQuestionDto,
      question,
    });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('question'))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @UploadedFile() question: Express.Multer.File,
  ) {
    return this.examSpeakQuestionsService.update(id, {
      question,
    });
  }
}
