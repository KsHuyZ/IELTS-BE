import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExamSchemaClass } from '../entities/exam.schema';
import { ExamRepository } from '../../exam.repository';
import { Exam } from '../../../../domain/exam';
import { ExamMapper } from '../mappers/exam.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { ExamStatus, ExamType } from '../../../../exams.type';

@Injectable()
export class examDocumentRepository implements ExamRepository {
  constructor(
    @InjectModel(ExamSchemaClass.name)
    private readonly examModel: Model<ExamSchemaClass>,
  ) {}

  async create(data: Exam): Promise<Exam> {
    const persistenceModel = ExamMapper.toPersistence(data);
    const createdEntity = new this.examModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return ExamMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    type,
    year,
  }: {
    paginationOptions: IPaginationOptions;
    type?: ExamType;
    status?: ExamStatus;
    userId: string;
    year: number;
  }): Promise<Exam[]> {
    const filter = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    } as any;
    if (type) {
      filter.type = type;
    }
    if (year) {
      filter.year = +year;
    }
    const entities = await this.examModel.find(filter);
    return entities.map(ExamMapper.toDomain);
  }

  async findById(id: Exam['id']): Promise<NullableType<Exam>> {
    const entityObject = await this.examModel.findById(id);
    return entityObject ? ExamMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: Exam['id'][]): Promise<Exam[]> {
    const entityObjects = await this.examModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      ExamMapper.toDomain(entityObject),
    );
  }

  async update(
    id: Exam['id'],
    payload: Partial<Exam>,
  ): Promise<NullableType<Exam>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.examModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.examModel.findOneAndUpdate(
      filter,
      ExamMapper.toPersistence({
        ...ExamMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? ExamMapper.toDomain(entityObject) : null;
  }

  async remove(id: Exam['id']): Promise<void> {
    await this.examModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  findYearsExam(): Promise<number[]> {
    return this.examModel.distinct('year').sort('year');
  }

  async findAllExams(): Promise<Exam[]> {
    const entities = await this.examModel.find();
    return entities.map(ExamMapper.toDomain);
  }

  async findAllExamsByType(type: ExamType): Promise<Exam[]> {
    const entities = await this.examModel.find({
      type,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    return entities.map(ExamMapper.toDomain);
  }

  async getTotalExam(): Promise<number> {
    return this.examModel.countDocuments();
  }
}
