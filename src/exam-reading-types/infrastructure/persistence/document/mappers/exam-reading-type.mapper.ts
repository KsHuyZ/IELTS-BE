import { ExamPassage } from '../../../../../exam-passages/domain/exam-passage';
import { ExamPassageSchemaClass } from '../../../../../exam-passages/infrastructure/persistence/document/entities/exam-passage.schema';
import { ExamReadingType } from '../../../../domain/exam-reading-type';
import { ExamReadingTypeSchemaClass } from '../entities/exam-reading-type.schema';

export class ExamReadingTypeMapper {
  public static toDomain(raw: ExamReadingTypeSchemaClass): ExamReadingType {
    const domainEntity = new ExamReadingType();
    domainEntity.id = raw._id.toString();
    const examPassage = new ExamPassage();
    examPassage.id = raw.examPassage._id.toString();
    domainEntity.examPassage = examPassage;
    domainEntity.type = raw.type;
    domainEntity.content = raw.content;
    domainEntity.image = raw.image;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.limitAnswer = raw.limitAnswer;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: ExamReadingType,
  ): ExamReadingTypeSchemaClass {
    const persistenceSchema = new ExamReadingTypeSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    const examPassage = new ExamPassageSchemaClass();
    examPassage._id = domainEntity.examPassage.id;
    persistenceSchema.examPassage = examPassage;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.image = domainEntity.image;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;
    persistenceSchema.limitAnswer = domainEntity.limitAnswer;

    return persistenceSchema;
  }
}
