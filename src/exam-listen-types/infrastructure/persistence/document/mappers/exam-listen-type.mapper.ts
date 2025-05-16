import { ExamListenSection } from '../../../../../exam-listen-sections/domain/exam-listen-section';
import { ExamListenSectionSchemaClass } from '../../../../../exam-listen-sections/infrastructure/persistence/document/entities/exam-listen-section.schema';
import { ExamListenType } from '../../../../domain/exam-listen-type';
import { ExamListenTypeSchemaClass } from '../entities/exam-listen-type.schema';

export class ExamListenTypeMapper {
  public static toDomain(raw: ExamListenTypeSchemaClass): ExamListenType {
    const domainEntity = new ExamListenType();
    domainEntity.id = raw._id.toString();
    const examSection = new ExamListenSection();
    examSection.id = raw.examSection._id.toString();
    domainEntity.examSection = examSection;
    domainEntity.content = raw.content;
    domainEntity.type = raw.type;
    domainEntity.limitAnswer = raw.limitAnswer;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: ExamListenType,
  ): ExamListenTypeSchemaClass {
    const persistenceSchema = new ExamListenTypeSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    const examSection = new ExamListenSectionSchemaClass();
    examSection._id = domainEntity.examSection.id;
    persistenceSchema.examSection = examSection;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.limitAnswer = domainEntity.limitAnswer;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
