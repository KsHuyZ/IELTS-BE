import { forwardRef, Module } from '@nestjs/common';
import { ExamReadingTypesService } from './exam-reading-types.service';
import { ExamReadingTypesController } from './exam-reading-types.controller';
import { DocumentExamReadingTypePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { ExamPassagesModule } from '../exam-passages/exam-passages.module';
import { ExamPassageQuestionsModule } from '../exam-passage-questions/exam-passage-questions.module';
import { ExamPassageAnswersModule } from '../exam-passage-answers/exam-passage-answers.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    DocumentExamReadingTypePersistenceModule,
    forwardRef(() => ExamPassagesModule),
    forwardRef(() => ExamPassageQuestionsModule),
    ExamPassageAnswersModule,
    CloudinaryModule,
  ],
  controllers: [ExamReadingTypesController],
  providers: [ExamReadingTypesService],
  exports: [ExamReadingTypesService, DocumentExamReadingTypePersistenceModule],
})
export class ExamReadingTypesModule {}
