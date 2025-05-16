import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PracticeListenAnswerSchemaClass } from '../entities/practice-listen-answer.schema';
import { PracticeListenAnswerRepository } from '../../practice-listen-answer.repository';
import { PracticeListenAnswer } from '../../../../domain/practice-listen-answer';
import { PracticeListenAnswerMapper } from '../mappers/practice-listen-answer.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class PracticeListenAnswerDocumentRepository
  implements PracticeListenAnswerRepository
{
  constructor(
    @InjectModel(PracticeListenAnswerSchemaClass.name)
    private readonly practiceListenAnswerModel: Model<PracticeListenAnswerSchemaClass>,
  ) {}

  async create(data: PracticeListenAnswer): Promise<PracticeListenAnswer> {
    const persistenceModel = PracticeListenAnswerMapper.toPersistence(data);
    const createdEntity = new this.practiceListenAnswerModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return PracticeListenAnswerMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<PracticeListenAnswer[]> {
    const entityObjects = await this.practiceListenAnswerModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      PracticeListenAnswerMapper.toDomain(entityObject),
    );
  }

  async findById(
    id: PracticeListenAnswer['id'],
  ): Promise<NullableType<PracticeListenAnswer>> {
    const entityObject = await this.practiceListenAnswerModel.findById(id);
    return entityObject
      ? PracticeListenAnswerMapper.toDomain(entityObject)
      : null;
  }

  async findByIds(
    ids: PracticeListenAnswer['id'][],
  ): Promise<PracticeListenAnswer[]> {
    const entityObjects = await this.practiceListenAnswerModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      PracticeListenAnswerMapper.toDomain(entityObject),
    );
  }

  async update(
    id: PracticeListenAnswer['id'],
    payload: Partial<PracticeListenAnswer>,
  ): Promise<NullableType<PracticeListenAnswer>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.practiceListenAnswerModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.practiceListenAnswerModel.findOneAndUpdate(
      filter,
      PracticeListenAnswerMapper.toPersistence({
        ...PracticeListenAnswerMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject
      ? PracticeListenAnswerMapper.toDomain(entityObject)
      : null;
  }

  async remove(id: PracticeListenAnswer['id']): Promise<void> {
    await this.practiceListenAnswerModel.deleteOne({ _id: id });
  }

  async createMany(
    data: PracticeListenAnswer[],
  ): Promise<PracticeListenAnswer[]> {
    const persistenceModels = data.map(
      PracticeListenAnswerMapper.toPersistence,
    );
    const createdEntities =
      await this.practiceListenAnswerModel.insertMany(persistenceModels);
    return createdEntities.map(PracticeListenAnswerMapper.toDomain);
  }
  async findByQuestionId(id: string): Promise<PracticeListenAnswer[]> {
    const entities = await this.practiceListenAnswerModel.find({
      question: { _id: id },
    });
    return entities.map(PracticeListenAnswerMapper.toDomain);
  }

  async findByCorrectQuestionId(id: string): Promise<PracticeListenAnswer[]> {
    const entities = await this.practiceListenAnswerModel.find({
      question: {
        _id: id,
      },
      isCorrect: true,
    });
    return entities.map(PracticeListenAnswerMapper.toDomain);
  }
}
