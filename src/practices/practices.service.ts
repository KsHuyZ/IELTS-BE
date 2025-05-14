import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { PracticeRepository } from './infrastructure/persistence/practice.repository';
import { Practice } from './domain/practice';
import { TopicsService } from '../topics/topics.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UsersService } from '../users/users.service';
import { UserPracticesService } from '../user-practices/user-practices.service';
import { PracticeType } from './pratices.type';
import { PracticeReadingsService } from '../practice-readings/practice-readings.service';
import { ExamStatus } from '../exams/exams.type';
import { QuestionType } from '../utils/types/question.type';
import { PracticeListensService } from '../practice-listens/practice-listens.service';
import { PracticeWritingsService } from '../practice-writings/practice-writings.service';
import { PracticeSpeakingQuestionsService } from '../practice-speaking-questions/practice-speaking-questions.service';
import { UserPracticeReadingAnswersService } from '../user-practice-reading-answers/user-practice-reading-answers.service';
import { PracticeReadingQuestion } from '../practice-reading-questions/domain/practice-reading-question';
import { PracticeReadingAnswersService } from '../practice-reading-answers/practice-reading-answers.service';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import { PracticeListenQuestion } from '../practice-listen-questions/domain/practice-listen-question';
import { UserPracticeListenAnswersService } from '../user-practice-listen-answers/user-practice-listen-answers.service';
import { PracticeListenAnswersService } from '../practice-listen-answers/practice-listen-answers.service';
import { UserPracticeWritingAnswersService } from '../user-practice-writing-answers/user-practice-writing-answers.service';
import { UserPracticeSpeakAnswersService } from '../user-practice-speak-answers/user-practice-speak-answers.service';
import { PracticeSpeakingQuestion } from '../practice-speaking-questions/domain/practice-speaking-question';
import { UserPracticeSessionsService } from '../user-practice-sessions/user-practice-sessions.service';
import { ExamWritingsService } from '../exam-writings/exam-writings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionPlan } from '../subscriptions/subscription.type';
import { UpdatePracticeDto } from './dto/update-practice.dto';
@Injectable()
export class PracticesService {
  constructor(
    private readonly practiceRepository: PracticeRepository,
    private readonly topicsService: TopicsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usersService: UsersService,
    private readonly userPracticesService: UserPracticesService,
    @Inject(forwardRef(() => PracticeReadingsService))
    private readonly practiceReadingsService: PracticeReadingsService,
    private readonly practiceListensService: PracticeListensService,
    private readonly practiceWritingsService: PracticeWritingsService,
    private readonly practiceSpeakingQuestionsService: PracticeSpeakingQuestionsService,
    private readonly userPracticeReadingAnswersService: UserPracticeReadingAnswersService,
    private readonly practiceReadingAnswersService: PracticeReadingAnswersService,
    private readonly userPracticeListenAnswersService: UserPracticeListenAnswersService,
    private readonly practiceListenAnswersService: PracticeListenAnswersService,
    private readonly userPracticeWritingAnswersService: UserPracticeWritingAnswersService,
    private readonly userPracticeSpeakAnswersService: UserPracticeSpeakAnswersService,
    private readonly userPracticeSessionsService: UserPracticeSessionsService,
    private readonly examWritingsService: ExamWritingsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(createPracticeDto: CreatePracticeDto) {
    const { topicId, image, ...rest } = createPracticeDto;
    const topic = await this.topicsService.findById(topicId);
    if (!topic) throw new NotFoundException('Topic not found');
    const { secure_url } = await this.cloudinaryService.uploadImage(image);
    return this.practiceRepository.create({
      topic,
      image: secure_url,
      ...rest,
    });
  }

  async findAllWithPagination({
    userId,
    status,
    topic,
    type,
    questionType,
  }: {
    userId: string;
    status?: ExamStatus;
    topic?: string;
    type?: PracticeType;
    questionType?: QuestionType;
  }) {
    const practices = await this.practiceRepository.findAllWithPagination({
      topic,
      type,
    });
    const practicesStatus = await Promise.all(
      practices.map(async (practice) => {
        const userExam =
          await this.userPracticesService.findByPracticeIdAndUserId(
            practice.id,
            userId,
          );
        const isIncludes = await this.practiceReadingsService.isIncludesTypes(
          practice.id,
          questionType,
        );
        return {
          ...practice,
          include: isIncludes,
          status: !userExam
            ? ExamStatus.NotStarted
            : !userExam.isCompleted
              ? ExamStatus.InProgress
              : ExamStatus.Completed,
        };
      }),
    );
    return practicesStatus.filter(
      (practice) =>
        (status ? practice.status === status : true) && practice.include,
    );
  }

  findById(id: Practice['id']) {
    return this.practiceRepository.findById(id);
  }

  findByIds(ids: Practice['id'][]) {
    return this.practiceRepository.findByIds(ids);
  }
  async startPractice(id: string, userId: string) {
    const practice = await this.practiceRepository.findById(id);
    if (!practice) throw new NotFoundException('Practice not found');
    if (practice.type === PracticeType.Writing) {
      const subscription = await this.subscriptionsService.findByUserId(userId);
      if (!subscription)
        throw new BadRequestException(
          'You need to subscribe to take this practice',
        );
      if (subscription.plan === SubscriptionPlan.Plus) {
        const userPractice =
          await this.userPracticesService.findByUserIdAndPracticeIdInDay(
            userId,
            id,
          );
        if (userPractice) {
          throw new BadRequestException(
            'You have already taken this practice today',
          );
        }
      }
    }
    const userPractice =
      await this.userPracticesService.findUnCompletedUserPracticeByPracticeIdAndUserId(
        id,
        userId,
      );
    if (userPractice) {
      return;
    }
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const newUserPractice = await this.userPracticesService.create({
      user,
      practice,
    });
    await this.userPracticeSessionsService.create({
      userPractice: newUserPractice,
      startTime: new Date(),
    });
    return;
  }

  async getUserPractice(id: string, userId: string) {
    const practice = await this.practiceRepository.findById(id);
    if (!practice) throw new NotFoundException('Practice not found');
    let practiceData = {} as any;
    const userPractice =
      await this.userPracticesService.findByPracticeIdAndUserId(id, userId);

    if (!userPractice) throw new NotFoundException('User Practice not found');

    if (practice.type === PracticeType.Reading) {
      practiceData = await this.practiceReadingsService.getPracticeData(
        id,
        userId,
      );
    }
    if (practice.type === PracticeType.Listening) {
      practiceData = await this.practiceListensService.getPracticeData(
        id,
        userId,
      );
    }
    if (practice.type === PracticeType.Writing) {
      practiceData = await this.practiceWritingsService.getPracticeData(
        id,
        userId,
      );
    }
    if (practice.type === PracticeType.Speaking) {
      practiceData =
        await this.practiceSpeakingQuestionsService.getPracticeData(id, userId);
    }
    return practiceData;
  }

  async submitPractice(id: string, userId: string, answers: any) {
    const practice = await this.practiceRepository.findById(id);
    if (!practice) throw new NotFoundException('Practice not found');
    const userPractice =
      await this.userPracticesService.findUnCompletedUserPracticeByPracticeIdAndUserId(
        id,
        userId,
      );
    if (!userPractice) throw new NotFoundException('User practice  not found');
    if (practice.type === PracticeType.Reading) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeReadingQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeReadingAnswersService.createMany(answerQuestions);
    }

    if (practice.type === PracticeType.Listening) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeListenQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeListenAnswersService.createMany(answerQuestions);
    }

    if (practice.type === PracticeType.Writing) {
      await this.userPracticeWritingAnswersService.create({
        userPractice,
        answer: answers.answer,
      });
    }

    if (practice.type === PracticeType.Speaking) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeSpeakingQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeSpeakAnswersService.createMany(answerQuestions);
    }

    const userPracticeSession =
      await this.userPracticeSessionsService.findByUserPracticeId(
        userPractice.id,
      );
    if (userPracticeSession) {
      await this.userPracticeSessionsService.update(userPracticeSession.id, {
        endTime: new Date(),
      });
    }

    let summary = [] as any[];

    if (practice.type === PracticeType.Reading) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.practiceReadingAnswersService.findByCorrectQuestionId(
              a.questionId,
            );
          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            isCorrect: isEqual(sortBy(correctAnswer), sortBy(userAnswer)),
          };
        }),
      );
    }
    if (practice.type === PracticeType.Listening) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.practiceListenAnswersService.findByCorrectQuestionId(
              a.questionId,
            );
          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            isCorrect: isEqual(sortBy(correctAnswer), sortBy(userAnswer)),
          };
        }),
      );
    }

    if (practice.type === PracticeType.Writing) {
      const practiceWriting =
        await this.practiceWritingsService.findByPracticeId(
          userPractice.practice.id,
        );
      if (!practiceWriting)
        throw new NotFoundException('Practice writing not found');
      const overall = await this.examWritingsService.gradeEssay(
        answers.answer,
        practiceWriting.content,
        1,
        practiceWriting.imageDetails,
      );
      await this.userPracticesService.update(userPractice.id, {
        taskResponse: overall.taskResponse.score,
        taskResponseDetails: overall.taskResponse.comment,
        coherenceAndCohesion: overall.coherenceAndCohesion.score,
        coherenceAndCohesionDetails: overall.coherenceAndCohesion.comment,
        lexicalResource: overall.lexicalResource.score,
        lexicalResourceDetails: overall.lexicalResource.comment,
        grammaticalRangeAndAccuracy: overall.grammaticalRangeAndAccuracy.score,
        grammaticalRangeAndAccuracyDetails:
          overall.grammaticalRangeAndAccuracy.comment,
        score: overall.overallBandScore,
        isCompleted: true,
      });
      return userPractice.id;
    }

    if (practice.type === PracticeType.Speaking) {
      return userPractice.id;
    }
    const correctScore = summary.filter((s) => s.isCorrect).length;
    const score = (correctScore / summary.length) * 10;
    await this.userPracticesService.update(userPractice.id, {
      score,
      isCompleted: true,
    });

    return userPractice.id;
  }

  async getSummaryByPracticeId(userPracticeId: string) {
    const userPractice =
      await this.userPracticesService.findById(userPracticeId);
    if (!userPractice) throw new NotFoundException('User practice  not found');
    const practice = await this.practiceRepository.findById(
      userPractice.practice.id,
    );
    if (!practice) throw new NotFoundException('practice not found');
    let summary = [] as any[];
    let answers = [] as any;

    if (practice.type === PracticeType.Reading) {
      answers =
        await this.userPracticeReadingAnswersService.findByUserPracticeId(
          userPractice.id,
        );
    }

    if (practice.type === PracticeType.Listening) {
      answers =
        await this.userPracticeListenAnswersService.findByUserPracticeId(
          userPractice.id,
        );
    }

    if (practice.type === PracticeType.Writing) {
      answers =
        await this.userPracticeWritingAnswersService.findByUserPracticeId(
          userPractice.id,
        );
    }

    if (practice.type === PracticeType.Reading) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.practiceReadingAnswersService.findByCorrectQuestionId(
              a.question.id,
            );
          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            questionId: a.question.id,
            isCorrect: isEqual(sortBy(correctAnswer), sortBy(userAnswer)),
            userAnswer: a.answer,
            correctAnswer,
          };
        }),
      );
    }
    if (practice.type === PracticeType.Listening) {
      summary = await Promise.all(
        answers.map(async (a) => {
          const answers =
            await this.practiceListenAnswersService.findByCorrectQuestionId(
              a.question.id,
            );
          const correctAnswer = answers.map((answer) =>
            answer.answer.toLowerCase(),
          );
          const userAnswer = Array.isArray(a.answer)
            ? a.answer.map((answer) => answer.toLowerCase())
            : [a.answer.toLowerCase()];
          return {
            questionId: a.question.id,
            isCorrect: isEqual(sortBy(correctAnswer), sortBy(userAnswer)),
            userAnswer: a.answer,
            correctAnswer,
          };
        }),
      );
    }

    if (practice.type === PracticeType.Writing) {
      return { ...userPractice, answers };
    }

    if (practice.type === PracticeType.Speaking) {
      return answers;
    }
    const correctScore = summary.filter((s) => s.isCorrect).length;
    const score = (correctScore / summary.length) * 10;
    return {
      score: userPractice.score || score,
      summary,
    };
  }

  async exitPractice(id: string, userId: string, answers: any) {
    const userPractice =
      await this.userPracticesService.findUnCompletedUserPracticeByPracticeIdAndUserId(
        id,
        userId,
      );
    if (!userPractice) throw new NotFoundException('user practice not found');
    const practice = await this.practiceRepository.findById(
      userPractice.practice.id,
    );
    if (!practice) throw new NotFoundException('Practice not found');
    if (practice.type === PracticeType.Reading) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeReadingQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeReadingAnswersService.createMany(answerQuestions);
    }
    if (practice.type === PracticeType.Listening) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeListenQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeListenAnswersService.createMany(answerQuestions);
    }

    if (practice.type === PracticeType.Speaking) {
      const answerQuestions = answers.map((a) => {
        const { answer, questionId } = a;
        const question = new PracticeSpeakingQuestion();
        question.id = questionId;
        return { answer, question, userPractice };
      });
      await this.userPracticeSpeakAnswersService.createMany(answerQuestions);
    }
    if (practice.type === PracticeType.Writing) {
      await this.userPracticeWritingAnswersService.create({
        userPractice,
        answer: answers.answer,
      });
    }
    const userPracticeSession =
      await this.userPracticeSessionsService.findByUserPracticeId(
        userPractice.id,
      );
    if (userPracticeSession) {
      await this.userPracticeSessionsService.update(userPracticeSession.id, {
        endTime: new Date(),
      });
    }
  }

  async getPracticeDetail(id: string) {
    const practice = await this.practiceRepository.findById(id);
    if (!practice) throw new NotFoundException('Practice not found');
    let practiceData = {} as any;
    if (practice.type === PracticeType.Reading) {
      practiceData =
        await this.practiceReadingsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Listening) {
      practiceData =
        await this.practiceListensService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Writing) {
      practiceData =
        await this.practiceWritingsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Speaking) {
      practiceData =
        await this.practiceSpeakingQuestionsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    return practiceData;
  }

  async getPracticeDetailType(id: string) {
    const practice = await this.practiceRepository.findById(id);
    if (!practice) throw new NotFoundException('Practice not found');
    let practiceData = {} as any;
    if (practice.type === PracticeType.Reading) {
      practiceData =
        await this.practiceReadingsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Listening) {
      practiceData =
        await this.practiceListensService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Writing) {
      practiceData =
        await this.practiceWritingsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    if (practice.type === PracticeType.Speaking) {
      practiceData =
        await this.practiceSpeakingQuestionsService.getPracticeDataWithQuestionAndAnswer(
          id,
        );
    }
    return {
      ...practice,
      practiceData,
    };
  }

  getTotalPractice() {
    return this.practiceRepository.getTotalPractice();
  }

  async update(id: string, updatePracticeDto: UpdatePracticeDto) {
    const { topicId, image, ...rest } = updatePracticeDto;
    const update = { ...rest } as Partial<Practice>;
    const topic = topicId ? await this.topicsService.findById(topicId) : null;
    if (topic) {
      update.topic = topic;
    }
    if (image) {
      const { secure_url } = await this.cloudinaryService.uploadImage(image);
      update.image = secure_url;
    }
    return this.practiceRepository.update(id, update);
  }

  remove(id: string) {
    return this.practiceRepository.remove(id);
  }
}
