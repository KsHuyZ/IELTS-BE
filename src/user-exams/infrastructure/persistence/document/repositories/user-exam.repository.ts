import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserExamSchemaClass } from '../entities/user-exam.schema';
import { UserExamRepository } from '../../user-exam.repository';
import { UserExam } from '../../../../domain/user-exam';
import { UserExamMapper } from '../mappers/user-exam.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { User } from '../../../../../users/domain/user';
import { Exam } from '../../../../../exams/domain/exam';
import { getAllDatesBetween } from '../../../../../utils/time';
import { addDays } from 'date-fns';

@Injectable()
export class UserExamDocumentRepository implements UserExamRepository {
  constructor(
    @InjectModel(UserExamSchemaClass.name)
    private readonly userExamModel: Model<UserExamSchemaClass>,
  ) {}
  async findByUserIdAndExamId(
    userId: User['id'],
    examId: UserExam['id'],
  ): Promise<NullableType<UserExam>> {
    const userExam = await this.userExamModel
      .findOne({
        user: {
          _id: userId,
        },
        exam: {
          _id: examId,
        },
      })
      .populate({ path: 'exam' })
      .sort({ createdAt: -1 });
    return userExam ? UserExamMapper.toDomain(userExam) : null;
  }

  async create(data: UserExam): Promise<UserExam> {
    const persistenceModel = UserExamMapper.toPersistence(data);
    const createdEntity = new this.userExamModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return UserExamMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<UserExam[]> {
    const entityObjects = await this.userExamModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      UserExamMapper.toDomain(entityObject),
    );
  }

  async findById(id: UserExam['id']): Promise<NullableType<UserExam>> {
    const entityObject = await this.userExamModel
      .findById(id)
      .populate({ path: 'exam' });
    return entityObject ? UserExamMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: UserExam['id'][]): Promise<UserExam[]> {
    const entityObjects = await this.userExamModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      UserExamMapper.toDomain(entityObject),
    );
  }

  async update(
    id: UserExam['id'],
    payload: Partial<UserExam>,
  ): Promise<NullableType<UserExam>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.userExamModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.userExamModel.findOneAndUpdate(
      filter,
      UserExamMapper.toPersistence({
        ...UserExamMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? UserExamMapper.toDomain(entityObject) : null;
  }

  async remove(id: UserExam['id']): Promise<void> {
    await this.userExamModel.deleteOne({ _id: id });
  }

  async findByUserId(id: User['id']): Promise<NullableType<UserExam>> {
    const userExam = await this.userExamModel
      .findOne({
        user: {
          _id: id,
        },
      })
      .sort({ createdAt: -1 })
      .populate('exam');
    return userExam ? UserExamMapper.toDomain(userExam) : null;
  }

  async getAvgScore(
    userId: User['id'],
    examIds: Exam['id'][],
  ): Promise<number> {
    const userExam = await this.userExamModel.find({
      user: {
        _id: userId,
      },
      'exam._id': {
        $in: examIds,
      },
      progress: 100,
    });
    return parseFloat(
      (
        userExam.reduce((acc, curr) => acc + curr.score, 0) / userExam.length
      ).toFixed(1),
    );
  }

  async getScoresByDayAndExamIds(
    userId: User['id'],
    startTime: Date,
    endTime: Date,
  ): Promise<{ score: number }[]> {
    const userExam = await this.userExamModel.find({
      user: {
        _id: userId,
      },
      updatedAt: {
        $gte: startTime,
        $lte: endTime,
      },
      progress: 100,
    });
    return userExam.map((exam) => ({
      score: exam.score,
    }));
  }

  async getScoresByDay(
    userId: User['id'],
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; [key: string]: any }[]> {
    const startTime = addDays(startDate, 1);
    const userExams = await this.userExamModel
      .find({
        user: {
          _id: userId,
        },
        updatedAt: {
          $gt: startTime,
          $lt: endDate,
        },
        progress: 100,
      })
      .populate('exam');
    const allDays = getAllDatesBetween(startTime, endDate);
    const dayScoreMap = new Map<
      string,
      Map<string, { total: number; count: number }>
    >();

    allDays.forEach((day) => {
      dayScoreMap.set(day, new Map<string, { total: number; count: number }>());
    });

    userExams.forEach((exam) => {
      const examDate = exam.updatedAt.toISOString().split('T')[0];
      const examType = exam.exam.type as string;

      if (!dayScoreMap.has(examDate)) {
        dayScoreMap.set(
          examDate,
          new Map<string, { total: number; count: number }>(),
        );
      }

      if (!dayScoreMap.get(examDate)?.has(examType)) {
        dayScoreMap.get(examDate)?.set(examType, { total: 0, count: 0 });
      }

      const current = dayScoreMap.get(examDate)?.get(examType);
      if (current) {
        current.total += exam.score;
        current.count += 1;
      }
    });

    const result: { date: string; [key: string]: any }[] = [];

    const allTypes = new Set<string>();
    userExams.forEach((exam) => {
      if (exam.exam && exam.exam.type) {
        allTypes.add(exam.exam.type as string);
      }
    });

    dayScoreMap.forEach((typeMap, date) => {
      const dayData: { date: string; [key: string]: any } = { date };

      allTypes.forEach((type) => {
        const scoreData = typeMap.get(type);

        if (scoreData && scoreData.count > 0) {
          dayData[type] =
            Math.round((scoreData.total / scoreData.count) * 10) / 10;
        } else {
          dayData[type] = 0;
        }
      });

      result.push(dayData);
    });

    return result.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  async findAllByUserId(userId: User['id']): Promise<UserExam[]> {
    const entityObjects = await this.userExamModel
      .find({
        user: {
          _id: userId,
        },
      })
      .populate('exam');
    return entityObjects.map(UserExamMapper.toDomain);
  }

  async findAllByUserIdWithPagination(
    userId: User['id'],
    limit = 5,
  ): Promise<UserExam[]> {
    const entityObjects = await this.userExamModel
      .find({
        user: {
          _id: userId,
        },
      })
      .populate('exam')
      .limit(limit)
      .sort({ updatedAt: -1 });
    return entityObjects.map(UserExamMapper.toDomain);
  }

  async getRecentExams(userId: User['id']): Promise<UserExam[]> {
    const entityObjects = await this.userExamModel
      .find({
        user: {
          _id: userId,
        },
      })
      .populate('exam')
      .sort({ createdAt: -1 });

    const uniqueExamsMap = new Map();

    entityObjects.forEach((userExam) => {
      const examId = userExam.exam._id.toString();
      if (!uniqueExamsMap.has(examId)) {
        uniqueExamsMap.set(examId, userExam);
      }
    });
    const uniqueExams = Array.from(uniqueExamsMap.values())
      .slice(0, 5)
      .map(UserExamMapper.toDomain);

    return uniqueExams;
  }

  async findByUserIdAndExamIdInDay(
    userId: User['id'],
    examId: UserExam['id'],
  ): Promise<NullableType<UserExam>> {
    const entityObject = await this.userExamModel.findOne({
      user: {
        _id: userId,
      },
      exam: {
        _id: examId,
      },
      updatedAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        $lte: new Date(),
      },
    });
    return entityObject ? UserExamMapper.toDomain(entityObject) : null;
  }
}
