import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PracticeReadingQuestionsService } from './practice-reading-questions.service';
import { CreatePracticeReadingQuestionDto } from './dto/create-practice-reading-question.dto';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PracticeReadingQuestion } from './domain/practice-reading-question';
import { UpdatePracticeReadingQuestionDto } from './dto/update-practice-reading-question.dto';

@ApiTags('Practicereadingquestions')
@Controller({
  path: 'practice-reading-questions',
  version: '1',
})
export class PracticeReadingQuestionsController {
  constructor(
    private readonly practiceReadingQuestionsService: PracticeReadingQuestionsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: PracticeReadingQuestion,
  })
  create(
    @Body() createPracticeReadingQuestionDto: CreatePracticeReadingQuestionDto,
  ) {
    return this.practiceReadingQuestionsService.create(
      createPracticeReadingQuestionDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePracticeReadingQuestionDto: UpdatePracticeReadingQuestionDto,
  ) {
    return this.practiceReadingQuestionsService.update(
      id,
      updatePracticeReadingQuestionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.practiceReadingQuestionsService.remove(id);
  }
}
