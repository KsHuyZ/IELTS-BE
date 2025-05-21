import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserExamSessionDto } from './dto/create-user-exam-session.dto';
import { UpdateUserExamSessionDto } from './dto/update-user-exam-session.dto';
import { UserExamSessionRepository } from './infrastructure/persistence/user-exam-session.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UserExamSession } from './domain/user-exam-session';
import { UserExamsService } from '../user-exams/user-exams.service';
import { UserExam } from '../user-exams/domain/user-exam';
import { User } from '../users/domain/user';
import { UserPracticeSessionsService } from '../user-practice-sessions/user-practice-sessions.service';
import { getAllDatesBetween } from '../utils/time';
@Injectable()
export class UserExamSessionsService {
  constructor(
    private readonly userExamSessionRepository: UserExamSessionRepository,
    @Inject(forwardRef(() => UserExamsService))
    private readonly userExamsService: UserExamsService,
    private readonly userPracticeSessionsService: UserPracticeSessionsService,
  ) {}

  async create(createUserExamSessionDto: CreateUserExamSessionDto) {
    const { examUserId, ...rest } = createUserExamSessionDto;

    const userExam = await this.userExamsService.findById(examUserId);

    if (!userExam) throw new BadRequestException('Exam user not found');
    return this.userExamSessionRepository.create({
      userExam,
      ...rest,
    });
  }

  findByExamUserId(examUserId: UserExam['id']) {
    return this.userExamSessionRepository.findLastSessionByUserExamId(
      examUserId,
    );
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.userExamSessionRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: UserExamSession['id']) {
    return this.userExamSessionRepository.findById(id);
  }

  findByIds(ids: UserExamSession['id'][]) {
    return this.userExamSessionRepository.findByIds(ids);
  }

  async update(
    id: UserExamSession['id'],
    updateUserExamSessionDto: UpdateUserExamSessionDto,
  ) {
    return this.userExamSessionRepository.update(id, updateUserExamSessionDto);
  }

  remove(id: UserExamSession['id']) {
    return this.userExamSessionRepository.remove(id);
  }

  async getTotalTimeSpent(userExamId: string): Promise<number> {
    const sessions =
      await this.userExamSessionRepository.getSessionsByUserExamId(userExamId);
    return sessions.reduce((total, session) => {
      const sessionTime =
        (session.endTime?.getTime() || new Date().getTime()) -
        session.startTime.getTime();
      return total + sessionTime;
    }, 0);
  }

  async getTimeSpentByDay(userId: User['id'], startTime: Date, endTime: Date) {
    const totalExamTimeSpent =
      await this.userExamSessionRepository.getTimeSpentByDay(
        userId,
        startTime,
        endTime,
      );
    const totalPracticeTimeSpent =
      await this.userPracticeSessionsService.getTimeSpentByDay(
        userId,
        startTime,
        endTime,
      );
    return totalExamTimeSpent.map((timeSpent, index) => ({
      ...timeSpent,
      timeSpent: timeSpent.timeSpent + totalPracticeTimeSpent[index].timeSpent,
    }));
  }
  async getTimeSpentByUserId(
    userId: User['id'],
    startTime: Date,
    endTime: Date,
  ) {
    const userExams = await this.userExamsService.findUserExamsByUserId(userId);
    const userExamIds = userExams.map((userExam) => userExam.id);
    const userExamSessions =
      await this.userExamSessionRepository.findByUserExamIds(
        userExamIds,
        startTime,
        endTime,
      );
    const allDays = getAllDatesBetween(startTime, endTime);
    const dayScoreMap = new Map<string, Map<string, { total: number }>>();

    allDays.forEach((day) => {
      dayScoreMap.set(day, new Map<string, { total: number }>());
    });
    userExamSessions.forEach((session) => {
      const examDate = session.createdAt.toISOString().split('T')[0];
      const examType = session.userExam.exam.type;
      if (!dayScoreMap.has(examDate)) {
        dayScoreMap.set(examDate, new Map<string, { total: number }>());
      }

      if (!dayScoreMap.get(examDate)?.has(examType)) {
        dayScoreMap.get(examDate)?.set(examType, { total: 0 });
      }
      const current = dayScoreMap.get(examDate)?.get(examType);
      if (current) {
        current.total += session.endTime?.getTime()
          ? session.endTime?.getTime() - session.startTime.getTime()
          : 0;
      }
    });

    const result: { date: string; [key: string]: any }[] = [];

    const allTypes = new Set<string>();
    userExams.forEach((exam) => {
      if (exam.exam && exam.exam.type) {
        allTypes.add(exam.exam.type);
      }
    });

    dayScoreMap.forEach((typeMap, date) => {
      const dayData: { date: string; [key: string]: any } = { date };

      allTypes.forEach((type) => {
        const scoreData = typeMap.get(type);
        dayData[type] = scoreData?.total || 0;
      });

      result.push(dayData);
    });

    const sortedResult = result.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return sortedResult;
  }

  findByUserExamId(userExamId: UserExam['id']) {
    return this.userExamSessionRepository.findByUserExamId(userExamId);
  }
}
