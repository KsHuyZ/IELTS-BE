import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PracticeSchemaClass } from '../entities/practice.schema';
import { PracticeRepository } from '../../practice.repository';
import { Practice } from '../../../../domain/practice';
import { PracticeMapper } from '../mappers/practice.mapper';
import { PracticeType } from '../../../../pratices.type';

@Injectable()
export class PracticeDocumentRepository implements PracticeRepository {
  constructor(
    @InjectModel(PracticeSchemaClass.name)
    private readonly practiceModel: Model<PracticeSchemaClass>,
  ) {}

  async create(data: Practice): Promise<Practice> {
    const persistenceModel = PracticeMapper.toPersistence(data);
    const createdEntity = new this.practiceModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return PracticeMapper.toDomain(entityObject);
  }

  async findAllWithPagination(filterOptions: {
    topic?: string;
    type?: PracticeType;
  }): Promise<Practice[]> {
    const filters = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    } as any;
    if (filterOptions.topic) {
      filters.topic = {
        _id: filterOptions.topic,
      };
    }
    if (filterOptions.type) {
      filters.type = filterOptions.type;
    }
    const entities = await this.practiceModel.find(filters);
    return entities.map(PracticeMapper.toDomain);
  }

  async findById(id: Practice['id']): Promise<NullableType<Practice>> {
    const entityObject = await this.practiceModel.findById(id);
    return entityObject ? PracticeMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: Practice['id'][]): Promise<Practice[]> {
    const entityObjects = await this.practiceModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      PracticeMapper.toDomain(entityObject),
    );
  }

  async update(
    id: Practice['id'],
    payload: Partial<Practice>,
  ): Promise<NullableType<Practice>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.practiceModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.practiceModel.findOneAndUpdate(
      filter,
      PracticeMapper.toPersistence({
        ...PracticeMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? PracticeMapper.toDomain(entityObject) : null;
  }

  async remove(id: Practice['id']): Promise<void> {
    await this.practiceModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  async getTotalPractice(): Promise<number> {
    return this.practiceModel.countDocuments({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
  }
}
