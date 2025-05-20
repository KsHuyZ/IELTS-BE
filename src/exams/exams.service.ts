import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamRepository } from './infrastructure/persistence/exam.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Exam } from './domain/exam';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ExamStatus, ExamType } from './exams.type';
import { ExamPassagesService } from '../exam-passages/exam-passages.service';
import { UserExamsService } from '../user-exams/user-exams.service';
import { User } from '../users/domain/user';
import { UserExamSessionsService } from '../user-exam-sessions/user-exam-sessions.service';
import { UserExam } from '../user-exams/domain/user-exam';
import { NullableType } from '../utils/types/nullable.type';
import { UserExamAnswersService } from '../user-exam-answers/user-exam-answers.service';
import { ExamPassageAnswersService } from '../exam-passage-answers/exam-passage-answers.service';
import { ExamListenSectionsService } from '../exam-listen-sections/exam-listen-sections.service';
import { UserExamListenAnswersService } from '../user-exam-listen-answers/user-exam-listen-answers.service';
import { UserExamSpeakAnswersService } from '../user-exam-speak-answers/user-exam-speak-answers.service';
import { ExamWritingsService } from '../exam-writings/exam-writings.service';
import { UserExamWritingsService } from '../user-exam-writings/user-exam-writings.service';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import { ExamListenAnswersService } from '../exam-listen-answers/exam-listen-answers.service';
import { getIELTSBandScore } from '../utils/band-score';
import { generateTimeByExamType } from '../utils/generate-time';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionPlan } from '../subscriptions/subscription.type';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamSpeakPartsService } from '../exam-speak-parts/exam-speak-parts.service';
@Injectable()
export class ExamsService {
  constructor(
    private readonly examRepository: ExamRepository,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => ExamPassagesService))
    private readonly examPassagesService: ExamPassagesService,
    @Inject(forwardRef(() => UserExamsService))
    private readonly userExamsService: UserExamsService,
    private readonly userExamSessionService: UserExamSessionsService,
    private readonly userExamAnswersService: UserExamAnswersService,
    private readonly examPassageAnswersService: ExamPassageAnswersService,
    @Inject(forwardRef(() => ExamListenSectionsService))
    private readonly examListenSectionsService: ExamListenSectionsService,
    private readonly userExamListenAnswersService: UserExamListenAnswersService,
    private readonly userExamSpeakAnswersService: UserExamSpeakAnswersService,
    private readonly examWritingsService: ExamWritingsService,
    private readonly userExamWritingsService: UserExamWritingsService,
    private readonly examListenAnswersService: ExamListenAnswersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly examSpeakPartsService: ExamSpeakPartsService,
  ) {}

  async create(createExamDto: CreateExamDto) {
    const [{ secure_url: image }, responseAudio] = await Promise.all(
      createExamDto.audio
        ? [
            this.cloudinaryService.uploadImage(createExamDto.file),
            this.cloudinaryService.uploadAudio(createExamDto.audio),
          ]
        : [this.cloudinaryService.uploadImage(createExamDto.file)],
    );
    return this.examRepository.create({
      ...createExamDto,
      image,
      audio: responseAudio?.secure_url ?? undefined,
      time: generateTimeByExamType(createExamDto.type),
    });
  }

  async update(id: Exam['id'], updateExamDto: UpdateExamDto) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    let audio, image;
    if (updateExamDto.audio) {
      audio = await this.cloudinaryService.uploadAudio(updateExamDto.audio);
    }
    if (updateExamDto.file) {
      image = await this.cloudinaryService.uploadImage(updateExamDto.file);
    }
    return this.examRepository.update(id, {
      ...exam,
      name: updateExamDto.name ?? undefined,
      year: updateExamDto.year ? +updateExamDto.year : undefined,
      audio: audio?.secure_url ?? undefined,
      image: image?.secure_url ?? undefined,
    });
  }

  async findAllWithPagination({
    type,
    status,
    userId,
    year,
  }: {
    paginationOptions: IPaginationOptions;
    type?: ExamType;
    status?: ExamStatus;
    userId: string;
    year?: number;
  }) {
    const exams = await this.examRepository.findAllWithPagination({
      type,
      year,
    });
    const examsStatus = await Promise.all(
      exams.map(async (exam) => {
        const userExam = await this.userExamsService.findByUserIdAndExamId(
          userId,
          exam.id,
        );
        return {
          ...exam,
          status: !userExam
            ? ExamStatus.NotStarted
            : userExam.progress < 100
              ? ExamStatus.InProgress
              : ExamStatus.Completed,
        };
      }),
    );
    return examsStatus.filter((exam) =>
      status ? exam.status === status : true,
    );
  }

  findById(id: Exam['id']) {
    return this.examRepository.findById(id);
  }

  findByIds(ids: Exam['id'][]) {
    return this.examRepository.findByIds(ids);
  }

  remove(id: Exam['id']) {
    return this.examRepository.remove(id);
  }

  async findAllPassage(id: Exam['id'], userId: User['id']) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    let examPassage = [] as any[];
    if (exam?.type === ExamType.Reading) {
      examPassage = await this.examPassagesService.findAllByExamIdAndUserId(
        id,
        userId,
      );
    }
    if (exam?.type === ExamType.Listening) {
      examPassage =
        await this.examListenSectionsService.findAllByExamIdAndUserId(
          id,
          userId,
        );
    }
    if (exam?.type === ExamType.Speaking) {
      examPassage = await this.examSpeakPartsService.findAllByExamIdAndUserId(
        id,
        userId,
      );
    }
    if (exam.type === ExamType.Writing) {
      examPassage = await this.examWritingsService.findAllByExamIdAndUserId(
        id,
        userId,
      );
    }
    return {
      ...exam,
      examPassage,
    };
  }

  findYearsExam() {
    return this.examRepository.findYearsExam();
  }

  async getRemainingTime(userExamId: string): Promise<number> {
    const userExam = await this.userExamsService.findById(userExamId);
    if (!userExam) {
      throw new BadRequestException('User exam not found');
    }

    const exam = await this.examRepository.findById(userExam.exam.id);
    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    const totalTimeSpent =
      await this.userExamSessionService.getTotalTimeSpent(userExamId);

    const remainingTime = exam.time - totalTimeSpent;
    return remainingTime > 0 ? remainingTime : 0;
  }

  async startExam(id: Exam['id'], userId: User['id']) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.type === ExamType.Writing) {
      const subscription = await this.subscriptionsService.findByUserId(userId);
      if (!subscription)
        throw new BadRequestException(
          'You need to subscribe to take this exam',
        );
      if (subscription.plan === SubscriptionPlan.Plus) {
        const userExam = await this.userExamsService.findByUserIdAndExamIdInDay(
          userId,
          id,
        );
        if (userExam) {
          throw new BadRequestException(
            'You have already taken this exam today',
          );
        }
      }
    }
    let userExam: NullableType<UserExam> = null;
    userExam = await this.userExamsService.findByUserIdAndExamId(userId, id);
    if (!userExam) {
      // first time
      userExam = await this.userExamsService.create({
        examId: id,
        userId,
        progress: 0,
        score: 0,
      });
    }
    const userExamSession = await this.userExamSessionService.findByExamUserId(
      userExam.id,
    );
    if (
      (!userExamSession || userExamSession.endTime) &&
      userExam.progress < 100
    ) {
      // continue from last session
      await this.userExamSessionService.create({
        startTime: new Date(),
        examUserId: userExam.id,
      });
    }
    if (
      (!userExamSession || userExamSession.endTime) &&
      userExam.progress === 100
    ) {
      // start new exam session
      const newUserExam = await this.userExamsService.create({
        examId: id,
        userId,
        progress: 0,
        score: 0,
      });
      await this.userExamSessionService.create({
        startTime: new Date(),
        examUserId: newUserExam.id,
      });
    }
  }

  async getExamData(id: Exam['id'], userId: User['id']) {
    const exam = await this.findAllPassage(id, userId);
    const userExam = await this.userExamsService.findByUserIdAndExamId(
      userId,
      id,
    );
    if (!userExam) throw new NotFoundException('User exam not found');
    const remainingTime = await this.getRemainingTime(userExam.id);
    return {
      exam,
      remainingTime,
    };
  }

  async exitExam(
    id: Exam['id'],
    userId: User['id'],
    answers: { questionId: string; answer: string | string[] }[],
  ) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    const now = new Date();
    const userExam = await this.userExamsService.findByUserIdAndExamId(
      userId,
      id,
    );
    if (!userExam) {
      throw new NotFoundException('User exam not found');
    }
    const userExamSession = await this.userExamSessionService.findByExamUserId(
      userExam.id,
    );

    if (!userExamSession) {
      throw new BadRequestException('This exam is not started!');
    }
    await this.userExamSessionService.update(userExamSession.id, {
      endTime: now,
    });
    const timeSpent = await this.userExamSessionService.getTotalTimeSpent(
      userExam.id,
    );
    await this.userExamsService.update(userExam.id, {
      progress: timeSpent / exam.time > 1 ? 100 : (timeSpent / exam.time) * 100,
    });
    if (exam.type === ExamType.Reading) {
      await this.userExamAnswersService.create(
        answers.map((a) => ({
          examId: id,
          examPassageQuestionId: a.questionId,
          answer: a.answer,
        })),
        userId,
      );
    }

    if (exam.type === ExamType.Listening) {
      await this.userExamListenAnswersService.create(
        answers.map((a) => ({
          examId: id,
          examPassageQuestionId: a.questionId,
          answer: a.answer,
        })),
        userId,
      );
    }
    if (exam.type === ExamType.Speaking) {
      await this.userExamSpeakAnswersService.createMany(
        answers.map((a) => ({
          examId: id,
          questionId: a.questionId,
          answer: Array.isArray(a.answer) ? a.answer[0] : a.answer,
        })),
        userId,
      );
    }
    if (exam.type === ExamType.Writing) {
      await this.userExamWritingsService.create(
        answers.map((a) => ({
          examId: id,
          examWritingId: a.questionId,
          answer: Array.isArray(a.answer) ? a.answer[0] : a.answer,
        })),
        userId,
      );
    }
  }

  async submitExam(
    id: Exam['id'],
    userId: User['id'],
    answers: { questionId: string; answer: string | string[] }[],
  ) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    const userExam = await this.userExamsService.findByUserIdAndExamId(
      userId,
      id,
    );

    if (!userExam) throw new NotFoundException('User exam not found');
    const userExamSession = await this.userExamSessionService.findByExamUserId(
      userExam.id,
    );

    if (!userExamSession)
      throw new BadRequestException('This exam is not started!');

    await this.userExamSessionService.update(userExamSession.id, {
      endTime: new Date(),
    });
    let summary = [] as any[];
    if (exam.type === ExamType.Reading) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers = await this.examPassageAnswersService.findByQuestionId(
            a.questionId,
          );
          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            isCorrect: isEqual(sortBy(userAnswer), sortBy(correctAnswer)),
          };
        }),
      );
    }

    if (exam.type === ExamType.Listening) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.examListenAnswersService.findCorrectAnswersByQuestionId(
              a.questionId,
            );

          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            isCorrect: isEqual(sortBy(userAnswer), sortBy(correctAnswer)),
          };
        }),
      );
    }
    if (exam.type === ExamType.Writing) {
      if (answers.length !== 2)
        throw new BadRequestException('Writing exam must have 2 answers');
      const task = await Promise.all([
        this.examWritingsService.gradeEssayExamWriting(
          answers[0].answer as string,
          answers[0].questionId,
          1,
        ),
        this.examWritingsService.gradeEssayExamWriting(
          answers[1].answer as string,
          answers[1].questionId,
          2,
        ),
      ]);
      summary = task;
    }
    const correctScore = summary.filter((s) => s.isCorrect).length;
    const score =
      exam.type === ExamType.Writing
        ? (summary[0].overallBandScore + summary[1].overallBandScore * 2) / 3
        : getIELTSBandScore(correctScore, exam.type);
    await this.userExamsService.update(userExam.id, {
      score,
      progress: 100,
    });
    if (exam.type === ExamType.Reading) {
      await this.userExamAnswersService.create(
        answers.map((a) => ({
          examId: id,
          examPassageQuestionId: a.questionId,
          answer: a.answer,
        })),
        userId,
      );
    }

    if (exam.type === ExamType.Listening) {
      await this.userExamListenAnswersService.create(
        answers.map((a) => ({
          examId: id,
          examPassageQuestionId: a.questionId,
          answer: a.answer,
        })),
        userId,
      );
    }
    if (exam.type === ExamType.Speaking) {
      await this.userExamSpeakAnswersService.createMany(
        answers.map((a) => ({
          examId: id,
          questionId: a.questionId,
          answer: Array.isArray(a.answer) ? a.answer[0] : a.answer,
        })),
        userId,
      );
    }
    if (exam.type === ExamType.Writing) {
      await this.userExamWritingsService.create(
        answers.map((a, index) => ({
          examId: id,
          examWritingId: a.questionId,
          answer: Array.isArray(a.answer) ? a.answer[0] : a.answer,
          taskResponse: summary[index].taskResponse.score,
          taskResponseDetails: summary[index].taskResponse.comment,
          coherenceAndCohesion: summary[index].coherenceAndCohesion.score,
          coherenceAndCohesionDetails:
            summary[index].coherenceAndCohesion.comment,
          lexicalResource: summary[index].lexicalResource.score,
          lexicalResourceDetails: summary[index].lexicalResource.comment,
          grammaticalRangeAndAccuracy:
            summary[index].grammaticalRangeAndAccuracy.score,
          grammaticalRangeAndAccuracyDetails:
            summary[index].grammaticalRangeAndAccuracy.comment,
          overallBandScore: summary[index].overallBandScore,
        })),
        userId,
      );
    }
    return userExam.id;
  }

  async getExamSummaryByUserExam(userExamId: UserExam['id']) {
    const userExam = await this.userExamsService.findById(userExamId);
    if (!userExam) throw new NotFoundException('User exam not found');
    const exam = userExam.exam;
    let answers = [] as any[];
    if (exam.type === ExamType.Reading) {
      answers = await this.userExamAnswersService.findByUserExamId(userExamId);
    }
    if (exam.type === ExamType.Listening) {
      answers = await this.userExamListenAnswersService.findByUserIdAndExamId(
        userExam.user.id,
        userExam.exam.id,
      );
    }
    if (exam.type === ExamType.Writing) {
      answers = await this.userExamWritingsService.findByUserIdAndExamId(
        userExam.user.id,
        userExam.exam.id,
      );
    }

    let summary = [] as any[];
    if (exam.type === ExamType.Reading) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers = await this.examPassageAnswersService.findByQuestionId(
            a.examPassageQuestion.id,
          );

          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            questionId: a.examPassageQuestion.id,
            isCorrect: isEqual(sortBy(correctAnswer), userAnswer),
            userAnswer: a.answer,
            correctAnswer,
          };
        }),
      );
    }

    if (exam.type === ExamType.Listening) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.examListenAnswersService.findCorrectAnswersByQuestionId(
              a.examPassageQuestion.id,
            );

          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];

          return {
            questionId: a.examPassageQuestion.id,
            isCorrect: isEqual(sortBy(userAnswer), sortBy(correctAnswer)),
            userAnswer: a.answer,
            correctAnswer,
          };
        }),
      );
    }

    if (exam.type === ExamType.Writing) {
      summary = answers.map((a) => {
        return {
          questionId: a.examWriting.id,
          overallBandScore: a.overallBandScore,
          taskResponse: a.taskResponse,
          taskResponseDetails: a.taskResponseDetails,
          coherenceAndCohesion: a.coherenceAndCohesion,
          coherenceAndCohesionDetails: a.coherenceAndCohesionDetails,
          lexicalResource: a.lexicalResource,
          lexicalResourceDetails: a.lexicalResourceDetails,
          grammaticalRangeAndAccuracy: a.grammaticalRangeAndAccuracy,
          grammaticalRangeAndAccuracyDetails:
            a.grammaticalRangeAndAccuracyDetails,
        };
      });
    }

    return {
      summary,
      score: userExam.score,
    };
  }
  findAllExams() {
    return this.examRepository.findAllExams();
  }
  async getTimeSpentByUserId(
    userId: User['id'],
    startTime: Date,
    endTime: Date,
  ) {
    return this.userExamSessionService.getTimeSpentByUserId(
      userId,
      startTime,
      endTime,
    );
  }

  findAllExamsByType(type: ExamType) {
    return this.examRepository.findAllExamsByType(type);
  }

  async getExamDetail(id: Exam['id']) {
    const exam = await this.examRepository.findById(id);
    if (!exam) throw new NotFoundException('Exam not found');
    let examPassage = [] as any[];
    if (exam?.type === ExamType.Reading) {
      examPassage = await this.examPassagesService.findAllByExamId(id);
    }
    if (exam?.type === ExamType.Listening) {
      examPassage = await this.examListenSectionsService.findAllByExamId(id);
    }
    if (exam?.type === ExamType.Speaking) {
      examPassage = await this.examSpeakPartsService.findAllByExamId(id);
    }
    if (exam.type === ExamType.Writing) {
      examPassage = await this.examWritingsService.findAllByExamId(id);
    }
    return {
      ...exam,
      examPassage,
    };
  }

  getTotalExam() {
    return this.examRepository.getTotalExam();
  }
}
