import { PracticeReading } from '../../../../../practice-readings/domain/practice-reading';
import { PracticeReadingSchemaClass } from '../../../../../practice-readings/infrastructure/persistence/document/entities/practice-reading.schema';
import { PracticeReadingType } from '../../../../domain/practice-reading-type';
import { PracticeReadingTypeSchemaClass } from '../entities/practice-reading-type.schema';

export class PracticeReadingTypeMapper {
  public static toDomain(
    raw: PracticeReadingTypeSchemaClass,
  ): PracticeReadingType {
    const domainEntity = new PracticeReadingType();
    domainEntity.id = raw._id.toString();
    const practiceReading = new PracticeReading();
    practiceReading.id = raw.practiceReading._id.toString();
    domainEntity.practiceReading = practiceReading;
    domainEntity.limitAnswer = raw.limitAnswer;
    domainEntity.type = raw.type;
    domainEntity.content = raw.content;
    domainEntity.image = raw.image;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: PracticeReadingType,
  ): PracticeReadingTypeSchemaClass {
    const persistenceSchema = new PracticeReadingTypeSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    const practiceReading = new PracticeReadingSchemaClass();
    practiceReading._id = domainEntity.practiceReading.id;
    persistenceSchema.practiceReading = practiceReading;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.image = domainEntity.image;
    persistenceSchema.limitAnswer = domainEntity.limitAnswer;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
