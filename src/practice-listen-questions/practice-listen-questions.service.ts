import { Injectable } from '@nestjs/common';
import { CreatePracticeListenQuestionDto } from './dto/create-practice-listen-question.dto';
import { PracticeListenQuestionRepository } from './infrastructure/persistence/practice-listen-question.repository';
import { PracticeListenQuestion } from './domain/practice-listen-question';
import { PracticeListenType } from '../practice-listen-types/domain/practice-listen-type';
import { PracticeListenAnswersService } from '../practice-listen-answers/practice-listen-answers.service';
import { UpdatePracticeListenQuestionDto } from './dto/update-practice-listen-question.dto';

@Injectable()
export class PracticeListenQuestionsService {
  constructor(
    private readonly practiceListenQuestionRepository: PracticeListenQuestionRepository,
    private readonly practiceListenAnswersService: PracticeListenAnswersService,
  ) {}

  async create(
    createPracticeListenQuestionDto: CreatePracticeListenQuestionDto,
  ) {
    const { typeId, answers, ...rest } = createPracticeListenQuestionDto;
    const type = new PracticeListenType();
    type.id = typeId;
    const question = await this.practiceListenQuestionRepository.create({
      type,
      ...rest,
    });
    const answersQuestion = await this.practiceListenAnswersService.createMany(
      answers.map((answer) => ({ ...answer, question })),
    );
    return { ...question, answers: answersQuestion };
  }

  async update(
    id: PracticeListenQuestion['id'],
    updatePracticeListenQuestionDto: UpdatePracticeListenQuestionDto,
  ) {
    const { answers, ...rest } = updatePracticeListenQuestionDto;
    const question = await this.practiceListenQuestionRepository.update(
      id,
      rest,
    );

    const newAnswers = answers.map((answer) => {
      return this.practiceListenAnswersService.update(answer.id, answer);
    });

    const answersQuestion = await Promise.all(newAnswers);

    return { ...question, answers: answersQuestion };
  }

  findById(id: PracticeListenQuestion['id']) {
    return this.practiceListenQuestionRepository.findById(id);
  }

  findByIds(ids: PracticeListenQuestion['id'][]) {
    return this.practiceListenQuestionRepository.findByIds(ids);
  }

  async findByTypeId(id: string) {
    const questions =
      await this.practiceListenQuestionRepository.findByTypeId(id);
    return Promise.all(
      questions.map(async (question) => {
        const answers =
          await this.practiceListenAnswersService.findByQuestionId(question.id);
        return { ...question, answers };
      }),
    );
  }

  remove(id: PracticeListenQuestion['id']) {
    return this.practiceListenQuestionRepository.remove(id);
  }
}
