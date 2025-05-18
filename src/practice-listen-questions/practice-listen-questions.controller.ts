import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PracticeListenQuestionsService } from './practice-listen-questions.service';
import { CreatePracticeListenQuestionDto } from './dto/create-practice-listen-question.dto';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PracticeListenQuestion } from './domain/practice-listen-question';
import { UpdatePracticeListenQuestionDto } from './dto/update-practice-listen-question.dto';

@ApiTags('Practicelistenquestions')
@Controller({
  path: 'practice-listen-questions',
  version: '1',
})
export class PracticeListenQuestionsController {
  constructor(
    private readonly practiceListenQuestionsService: PracticeListenQuestionsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: PracticeListenQuestion,
  })
  create(
    @Body() createPracticeListenQuestionDto: CreatePracticeListenQuestionDto,
  ) {
    return this.practiceListenQuestionsService.create(
      createPracticeListenQuestionDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePracticeListenQuestionDto: UpdatePracticeListenQuestionDto,
  ) {
    return this.practiceListenQuestionsService.update(
      id,
      updatePracticeListenQuestionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.practiceListenQuestionsService.remove(id);
  }
}
