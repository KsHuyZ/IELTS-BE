import { Injectable } from '@nestjs/common';
import { CreatePracticeListenTypeDto } from './dto/create-practice-listen-type.dto';
import { PracticeListenTypeRepository } from './infrastructure/persistence/practice-listen-type.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { PracticeListenType } from './domain/practice-listen-type';
import { PracticeListen } from '../practice-listens/domain/practice-listen';
import { PracticeListenQuestionsService } from '../practice-listen-questions/practice-listen-questions.service';
import { UpdatePracticeListenTypeDto } from './dto/update-practice-listen-type.dto';

@Injectable()
export class PracticeListenTypesService {
  constructor(
    private readonly practiceListenTypeRepository: PracticeListenTypeRepository,
    private readonly practiceListenQuestionsService: PracticeListenQuestionsService,
  ) {}

  async create(createPracticeListenTypeDto: CreatePracticeListenTypeDto) {
    const practiceListen = new PracticeListen();
    const { practiceListenId, ...rest } = createPracticeListenTypeDto;
    practiceListen.id = practiceListenId;
    return this.practiceListenTypeRepository.create({
      practiceListen,
      ...rest,
    });
  }

  async update(
    id: PracticeListenType['id'],
    updatePracticeListenTypeDto: UpdatePracticeListenTypeDto,
  ) {
    return this.practiceListenTypeRepository.update(
      id,
      updatePracticeListenTypeDto,
    );
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.practiceListenTypeRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: PracticeListenType['id']) {
    return this.practiceListenTypeRepository.findById(id);
  }

  findByIds(ids: PracticeListenType['id'][]) {
    return this.practiceListenTypeRepository.findByIds(ids);
  }

  remove(id: PracticeListenType['id']) {
    return this.practiceListenTypeRepository.remove(id);
  }

  async findByPracticeListenId(id: string) {
    const types =
      await this.practiceListenTypeRepository.findByPracticeListenId(id);
    return Promise.all(
      types.map(async (type) => {
        const questions =
          await this.practiceListenQuestionsService.findByTypeId(type.id);
        return {
          type: type.type,
          questions,
          content: type.content,
          id: type.id,
          limitAnswer: type.limitAnswer,
        };
      }),
    );
  }
}
