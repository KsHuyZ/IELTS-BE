import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PracticeReadingAnswerSchemaClass } from '../entities/practice-reading-answer.schema';
import { PracticeReadingAnswerRepository } from '../../practice-reading-answer.repository';
import { PracticeReadingAnswer } from '../../../../domain/practice-reading-answer';
import { PracticeReadingAnswerMapper } from '../mappers/practice-reading-answer.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class PracticeReadingAnswerDocumentRepository
  implements PracticeReadingAnswerRepository
{
  constructor(
    @InjectModel(PracticeReadingAnswerSchemaClass.name)
    private readonly practiceReadingAnswerModel: Model<PracticeReadingAnswerSchemaClass>,
  ) {}

  async create(data: PracticeReadingAnswer): Promise<PracticeReadingAnswer> {
    const persistenceModel = PracticeReadingAnswerMapper.toPersistence(data);
    const createdEntity = new this.practiceReadingAnswerModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return PracticeReadingAnswerMapper.toDomain(entityObject);
  }

  async createMany(
    data: PracticeReadingAnswer[],
  ): Promise<PracticeReadingAnswer[]> {
    const persistenceModels = data.map(
      PracticeReadingAnswerMapper.toPersistence,
    );
    const createdEntities =
      await this.practiceReadingAnswerModel.insertMany(persistenceModels);
    return createdEntities.map(PracticeReadingAnswerMapper.toDomain);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<PracticeReadingAnswer[]> {
    const entityObjects = await this.practiceReadingAnswerModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      PracticeReadingAnswerMapper.toDomain(entityObject),
    );
  }

  async findById(
    id: PracticeReadingAnswer['id'],
  ): Promise<NullableType<PracticeReadingAnswer>> {
    const entityObject = await this.practiceReadingAnswerModel.findById(id);
    return entityObject
      ? PracticeReadingAnswerMapper.toDomain(entityObject)
      : null;
  }

  async findByIds(
    ids: PracticeReadingAnswer['id'][],
  ): Promise<PracticeReadingAnswer[]> {
    const entityObjects = await this.practiceReadingAnswerModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      PracticeReadingAnswerMapper.toDomain(entityObject),
    );
  }

  async update(
    id: PracticeReadingAnswer['id'],
    payload: Partial<PracticeReadingAnswer>,
  ): Promise<NullableType<PracticeReadingAnswer>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.practiceReadingAnswerModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.practiceReadingAnswerModel.findOneAndUpdate(
      filter,
      PracticeReadingAnswerMapper.toPersistence({
        ...PracticeReadingAnswerMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject
      ? PracticeReadingAnswerMapper.toDomain(entityObject)
      : null;
  }

  async remove(id: PracticeReadingAnswer['id']): Promise<void> {
    await this.practiceReadingAnswerModel.deleteOne({ _id: id });
  }

  async findByQuestionId(id: string): Promise<PracticeReadingAnswer[]> {
    const entities = await this.practiceReadingAnswerModel.find({
      question: {
        _id: id,
      },
    });
    return entities.map(PracticeReadingAnswerMapper.toDomain);
  }

  async findByCorrectQuestionId(id: string): Promise<PracticeReadingAnswer[]> {
    const entities = await this.practiceReadingAnswerModel.find({
      question: {
        _id: id,
      },
      isCorrect: true,
    });
    return entities.map(PracticeReadingAnswerMapper.toDomain);
  }
}
