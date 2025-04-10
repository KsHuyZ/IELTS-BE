import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserExamSessionSchemaClass } from '../entities/user-exam-session.schema';
import { UserExamSessionRepository } from '../../user-exam-session.repository';
import { UserExamSession } from '../../../../domain/user-exam-session';
import { UserExamSessionMapper } from '../mappers/user-exam-session.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { UserExam } from '../../../../../user-exams/domain/user-exam';
import { User } from '../../../../../users/domain/user';
import { getAllDatesBetween } from '../../../../../utils/time';

@Injectable()
export class UserExamSessionDocumentRepository
  implements UserExamSessionRepository
{
  constructor(
    @InjectModel(UserExamSessionSchemaClass.name)
    private readonly userExamSessionModel: Model<UserExamSessionSchemaClass>,
  ) {}

  async create(data: UserExamSession): Promise<UserExamSession> {
    const persistenceModel = UserExamSessionMapper.toPersistence(data);
    const createdEntity = new this.userExamSessionModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return UserExamSessionMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<UserExamSession[]> {
    const entityObjects = await this.userExamSessionModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      UserExamSessionMapper.toDomain(entityObject),
    );
  }

  async findById(
    id: UserExamSession['id'],
  ): Promise<NullableType<UserExamSession>> {
    const entityObject = await this.userExamSessionModel.findById(id);
    return entityObject ? UserExamSessionMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: UserExamSession['id'][]): Promise<UserExamSession[]> {
    const entityObjects = await this.userExamSessionModel.find({
      _id: { $in: ids },
    });
    return entityObjects.map((entityObject) =>
      UserExamSessionMapper.toDomain(entityObject),
    );
  }

  async update(
    id: UserExamSession['id'],
    payload: Partial<UserExamSession>,
  ): Promise<NullableType<UserExamSession>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.userExamSessionModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.userExamSessionModel.findOneAndUpdate(
      filter,
      UserExamSessionMapper.toPersistence({
        ...UserExamSessionMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? UserExamSessionMapper.toDomain(entityObject) : null;
  }

  async remove(id: UserExamSession['id']): Promise<void> {
    await this.userExamSessionModel.deleteOne({ _id: id });
  }

  async getSessionsByUserExamId(
    userExamId: UserExam['id'],
  ): Promise<UserExamSession[]> {
    const entityObjects = await this.userExamSessionModel.find({
      userExam: {
        _id: userExamId,
      },
    });
    return entityObjects.map(UserExamSessionMapper.toDomain);
  }

  async findLastSessionByUserExamId(
    userExamId: UserExam['id'],
  ): Promise<NullableType<UserExamSession>> {
    const entity = await this.userExamSessionModel
      .findOne({
        userExam: {
          _id: userExamId,
        },
      })
      .sort({ createdAt: -1 });
    return entity ? UserExamSessionMapper.toDomain(entity) : null;
  }

  async getTimeSpentByDay(
    userId: User['id'],
    startTime: Date,
    endTime: Date,
  ): Promise<{ date: string; [key: string]: any }[]> {
    const entityObjects = await this.userExamSessionModel.find({
      user: {
        _id: userId,
      },
    });
    const allDays = getAllDatesBetween(startTime, endTime);
    const dayTimeSpentMap = new Map<string, number>();
    allDays.forEach((day) => {
      dayTimeSpentMap.set(day, 0);
    });
    entityObjects.forEach((session) => {
      const sessionDate = session.createdAt.toISOString().split('T')[0];
      const timeSpent = session.endTime
        ? session.endTime.getTime() - session.startTime.getTime()
        : 0;
      dayTimeSpentMap.set(
        sessionDate,
        (dayTimeSpentMap.get(sessionDate) || 0) + timeSpent,
      );
    });
    return Array.from(dayTimeSpentMap.entries()).map(([date, timeSpent]) => ({
      date,
      timeSpent,
    }));
  }

  async getTimeSpentByUserId(
    userId: User['id'],
    startTime: Date,
    endTime: Date,
  ): Promise<{ date: string; [key: string]: any }[]> {
    const entityObjects = await this.userExamSessionModel.find({
      'userExam.user._id': userId,
      startTime: { $gte: startTime },
      endTime: { $lte: endTime },
    });
    const allDays = getAllDatesBetween(startTime, endTime);
    const dayTimeSpentMap = new Map<string, number>();
    allDays.forEach((day) => {
      dayTimeSpentMap.set(day, 0);
    });
    entityObjects.forEach((session) => {
      const sessionDate = session.createdAt.toISOString().split('T')[0];
      const timeSpent = session.endTime
        ? session.endTime.getTime() - session.startTime.getTime()
        : 0;
      dayTimeSpentMap.set(
        sessionDate,
        (dayTimeSpentMap.get(sessionDate) || 0) + timeSpent,
      );
    });
    return Array.from(dayTimeSpentMap.entries()).map(([date, timeSpent]) => ({
      date,
      timeSpent,
    }));
  }

  async findByUserExamIds(
    userExamIds: UserExam['id'][],
    startTime: Date,
    endTime: Date,
  ): Promise<UserExamSessionSchemaClass[]> {
    return this.userExamSessionModel
      .find({
        'userExam._id': {
          $in: userExamIds,
        },
        updatedAt: { $gte: startTime, $lte: endTime },
      })
      .populate({
        path: 'userExam',
        populate: {
          path: 'exam',
        },
      });
  }

  async findByUserExamId(
    userExamId: UserExam['id'],
  ): Promise<UserExamSession[]> {
    return this.userExamSessionModel.find({ userExam: { _id: userExamId } });
  }
}
