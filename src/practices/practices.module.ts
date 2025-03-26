import { forwardRef, Module } from '@nestjs/common';
import { PracticesService } from './practices.service';
import { PracticesController } from './practices.controller';
import { DocumentPracticePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { TopicsModule } from '../topics/topics.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersModule } from '../users/users.module';
import { UserPracticesModule } from '../user-practices/user-practices.module';
import { PracticeReadingsModule } from '../practice-readings/practice-readings.module';
import { PracticeListensModule } from '../practice-listens/practice-listens.module';
import { PracticeWritingsModule } from '../practice-writings/practice-writings.module';
import { PracticeSpeakingQuestionsModule } from '../practice-speaking-questions/practice-speaking-questions.module';
import { UserPracticeReadingAnswersModule } from '../user-practice-reading-answers/user-practice-reading-answers.module';
import { PracticeReadingAnswersModule } from '../practice-reading-answers/practice-reading-answers.module';

@Module({
  imports: [
    DocumentPracticePersistenceModule,
    TopicsModule,
    CloudinaryModule,
    UsersModule,
    UserPracticesModule,
    forwardRef(() => PracticeReadingsModule),
    PracticeListensModule,
    PracticeWritingsModule,
    PracticeSpeakingQuestionsModule,
    UserPracticeReadingAnswersModule,
    PracticeReadingAnswersModule,
  ],
  controllers: [PracticesController],
  providers: [PracticesService],
  exports: [PracticesService, DocumentPracticePersistenceModule],
})
export class PracticesModule {}
