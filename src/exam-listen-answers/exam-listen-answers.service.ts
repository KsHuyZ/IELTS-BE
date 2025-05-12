import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExamListenAnswerDto } from './dto/create-exam-listen-answer.dto';
import { UpdateExamListenAnswerDto } from './dto/update-exam-listen-answer.dto';
import { ExamListenAnswerRepository } from './infrastructure/persistence/exam-listen-answer.repository';
import { ExamListenAnswer } from './domain/exam-listen-answer';
import { ExamListenQuestionsService } from '../exam-listen-questions/exam-listen-questions.service';
import { ExamListenQuestion } from '../exam-listen-questions/domain/exam-listen-question';

@Injectable()
export class ExamListenAnswersService {
  constructor(
    private readonly examListenAnswerRepository: ExamListenAnswerRepository,
    @Inject(forwardRef(() => ExamListenQuestionsService))
    private readonly examListenQuestionsService: ExamListenQuestionsService,
  ) {}

  async create(createExamListenAnswerDto: CreateExamListenAnswerDto) {
    const { examListenQuestionId, ...rest } = createExamListenAnswerDto;
    const examListenQuestion =
      await this.examListenQuestionsService.findById(examListenQuestionId);
    if (!examListenQuestion)
      throw new NotFoundException('Exam listen question not found');
    return this.examListenAnswerRepository.create({
      examListenQuestion,
      ...rest,
    });
  }

  findByQuestionId(questionId: ExamListenQuestion['id']) {
    return this.examListenAnswerRepository.findByQuestionId(questionId);
  }

  findById(id: ExamListenAnswer['id']) {
    return this.examListenAnswerRepository.findById(id);
  }

  findByIds(ids: ExamListenAnswer['id'][]) {
    return this.examListenAnswerRepository.findByIds(ids);
  }

  async update(
    id: ExamListenAnswer['id'],
    updateExamListenAnswerDto: UpdateExamListenAnswerDto,
  ) {
    return this.examListenAnswerRepository.update(
      id,
      updateExamListenAnswerDto,
    );
  }

  remove(id: ExamListenAnswer['id']) {
    return this.examListenAnswerRepository.remove(id);
  }

  findCorrectAnswersByQuestionId(questionId: string) {
    return this.examListenAnswerRepository.findCorrectAnswersByQuestionId(
      questionId,
    );
  }
}
