import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserExamDto } from './dto/create-user-exam.dto';
import { UpdateUserExamDto } from './dto/update-user-exam.dto';
import { UserExamRepository } from './infrastructure/persistence/user-exam.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UserExam } from './domain/user-exam';
import { UsersService } from '../users/users.service';
import { ExamsService } from '../exams/exams.service';
import { User } from '../users/domain/user';
import { ExamType } from '../exams/exams.type';
import { UserExamSessionsService } from '../user-exam-sessions/user-exam-sessions.service';
@Injectable()
export class UserExamsService {
  constructor(
    private readonly userExamRepository: UserExamRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ExamsService))
    private readonly examsService: ExamsService,
    @Inject(forwardRef(() => UserExamSessionsService))
    private readonly userExamSessionsService: UserExamSessionsService,
  ) {}

  async create(createUserExamDto: CreateUserExamDto) {
    const { userId, examId, ...rest } = createUserExamDto;
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const exam = await this.examsService.findById(examId);

    if (!exam) throw new BadRequestException('Exam not found');
    return this.userExamRepository.create({
      user,
      exam,
      ...rest,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.userExamRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: UserExam['id']) {
    return this.userExamRepository.findById(id);
  }

  findByUserIdAndExamId(userId: User['id'], examId: UserExam['id']) {
    return this.userExamRepository.findByUserIdAndExamId(userId, examId);
  }

  findByUserIdAndExamIdInDay(userId: User['id'], examId: UserExam['id']) {
    return this.userExamRepository.findByUserIdAndExamIdInDay(userId, examId);
  }

  findByIds(ids: UserExam['id'][]) {
    return this.userExamRepository.findByIds(ids);
  }

  async update(id: UserExam['id'], updateUserExamDto: UpdateUserExamDto) {
    return this.userExamRepository.update(id, updateUserExamDto);
  }

  remove(id: UserExam['id']) {
    return this.userExamRepository.remove(id);
  }

  findByUserId(id: User['id']) {
    return this.userExamRepository.findByUserId(id);
  }

  async getAvgScore(userId: User['id']) {
    const exams = await this.examsService.findAllExams();
    const examReadingIds = exams
      .filter((exam) => exam.type === ExamType.Reading)
      .map((exam) => exam.id);
    const examListeningIds = exams
      .filter((exam) => exam.type === ExamType.Listening)
      .map((exam) => exam.id);
    const examWritingIds = exams
      .filter((exam) => exam.type === ExamType.Writing)
      .map((exam) => exam.id);
    const reading = await this.userExamRepository.getAvgScore(
      userId,
      examReadingIds,
    );
    const listening = await this.userExamRepository.getAvgScore(
      userId,
      examListeningIds,
    );
    const writing = await this.userExamRepository.getAvgScore(
      userId,
      examWritingIds,
    );
    return {
      reading,
      listening,
      writing,
    };
  }

  async getScoresByDay(userId: User['id'], startTime: Date, endTime: Date) {
    return this.userExamRepository.getScoresByDay(userId, startTime, endTime);
  }

  findUserExamsByUserId(userId: User['id']) {
    return this.userExamRepository.findAllByUserId(userId);
  }

  async getUserExamByUserIdWithPagination(userId: User['id']) {
    const userExams =
      await this.userExamRepository.findAllByUserIdWithPagination(userId, 5);
    return Promise.all(
      userExams.map(async (userExam) => {
        const userExamSession =
          await this.userExamSessionsService.findByUserExamId(userExam.id);
        const startTime = userExamSession[0].startTime;
        const isCompleted = userExam.progress === 100;
        const endTime = isCompleted
          ? userExamSession[userExamSession.length - 1].endTime
          : null;
        return {
          ...userExam,
          startTime,
          endTime,
          isCompleted,
        };
      }),
    );
  }

  async getRecentExams(userId: User['id']) {
    const exams = await this.userExamRepository.getRecentExams(userId);
    return exams.map((exam) => {
      return {
        ...exam,
        isCompleted: exam.progress === 100,
      };
    });
  }

  async getSuggestionExams(userId: User['id']) {
    const { reading, listening, writing } = await this.getAvgScore(userId);
    if (reading > listening && reading > writing) {
      return this.examsService.findAllExamsByType(ExamType.Reading);
    }
    if (listening > reading && listening > writing) {
      return this.examsService.findAllExamsByType(ExamType.Listening);
    }
    return this.examsService.findAllExamsByType(ExamType.Writing);
  }
}
