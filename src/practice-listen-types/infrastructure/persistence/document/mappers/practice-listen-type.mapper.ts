import { PracticeListen } from '../../../../../practice-listens/domain/practice-listen';
import { PracticeListenSchemaClass } from '../../../../../practice-listens/infrastructure/persistence/document/entities/practice-listen.schema';
import { PracticeListenType } from '../../../../domain/practice-listen-type';
import { PracticeListenTypeSchemaClass } from '../entities/practice-listen-type.schema';

export class PracticeListenTypeMapper {
  public static toDomain(
    raw: PracticeListenTypeSchemaClass,
  ): PracticeListenType {
    const domainEntity = new PracticeListenType();
    domainEntity.id = raw._id.toString();
    const practiceListen = new PracticeListen();
    practiceListen.id = raw.practiceListen._id.toString();
    domainEntity.practiceListen = practiceListen;
    domainEntity.type = raw.type;
    domainEntity.content = raw.content;
    domainEntity.limitAnswer = raw.limitAnswer;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(
    domainEntity: PracticeListenType,
  ): PracticeListenTypeSchemaClass {
    const persistenceSchema = new PracticeListenTypeSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    const practiceListen = new PracticeListenSchemaClass();
    practiceListen._id = domainEntity.practiceListen.id;
    persistenceSchema.practiceListen = practiceListen;
    persistenceSchema.type = domainEntity.type;
    persistenceSchema.content = domainEntity.content;
    persistenceSchema.limitAnswer = domainEntity.limitAnswer;
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
