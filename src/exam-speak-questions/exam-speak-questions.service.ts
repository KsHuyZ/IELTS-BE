import { Injectable } from '@nestjs/common';
import { CreateExamSpeakQuestionDto } from './dto/create-exam-speak-question.dto';
import { UpdateExamSpeakQuestionDto } from './dto/update-exam-speak-question.dto';
import { ExamSpeakQuestionRepository } from './infrastructure/persistence/exam-speak-question.repository';
import { ExamSpeakQuestion } from './domain/exam-speak-question';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ExamSpeakPart } from '../exam-speak-parts/domain/exam-speak-part';

@Injectable()
export class ExamSpeakQuestionsService {
  constructor(
    private readonly examSpeakQuestionRepository: ExamSpeakQuestionRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createExamSpeakQuestionDto: CreateExamSpeakQuestionDto) {
    const { partId, question } = createExamSpeakQuestionDto;
    const part = new ExamSpeakPart();
    part.id = partId;
    const { secure_url } = await this.cloudinaryService.uploadAudio(question);
    return this.examSpeakQuestionRepository.create({
      question: secure_url,
      part,
    });
  }

  findById(id: ExamSpeakQuestion['id']) {
    return this.examSpeakQuestionRepository.findById(id);
  }

  findByIds(ids: ExamSpeakQuestion['id'][]) {
    return this.examSpeakQuestionRepository.findByIds(ids);
  }

  async update(
    id: ExamSpeakQuestion['id'],
    updateExamSpeakQuestionDto: UpdateExamSpeakQuestionDto,
  ) {
    const { question } = updateExamSpeakQuestionDto;
    const { secure_url } = await this.cloudinaryService.uploadAudio(question);

    return this.examSpeakQuestionRepository.update(id, {
      question: secure_url,
    });
  }

  remove(id: ExamSpeakQuestion['id']) {
    return this.examSpeakQuestionRepository.remove(id);
  }

  findAllByPartId(partId: ExamSpeakPart['id']) {
    return this.examSpeakQuestionRepository.findAllByPartId(partId);
  }
}
