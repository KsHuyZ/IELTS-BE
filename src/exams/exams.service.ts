import { Injectable } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamRepository } from './infrastructure/persistence/exam.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Exam } from './domain/exam';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ExamType } from './exams.type';

@Injectable()
export class ExamsService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createExamDto: CreateExamDto) {
    const { secure_url } = await this.cloudinaryService.uploadImage(
      createExamDto.file,
    );
    return this.examRepository.create({
      ...createExamDto,
      image: secure_url,
    });
  }

  findAllWithPagination({
    paginationOptions,
    type,
  }: {
    paginationOptions: IPaginationOptions;
    type?: ExamType;
  }) {
    return this.examRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      type,
    });
  }

  findById(id: Exam['id']) {
    return this.examRepository.findById(id);
  }

  findByIds(ids: Exam['id'][]) {
    return this.examRepository.findByIds(ids);
  }

  async update(
    id: Exam['id'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateExamDto: UpdateExamDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.examRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
    });
  }

  remove(id: Exam['id']) {
    return this.examRepository.remove(id);
  }
}
