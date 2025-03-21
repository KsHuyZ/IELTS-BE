import { Choice } from '../../../../domain/choice';
import { ChoiceSchemaClass } from '../entities/choice.schema';

export class ChoiceMapper {
  public static toDomain(raw: ChoiceSchemaClass): Choice {
    const domainEntity = new Choice();
    domainEntity.id = raw._id.toString();
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  public static toPersistence(domainEntity: Choice): ChoiceSchemaClass {
    const persistenceSchema = new ChoiceSchemaClass();
    if (domainEntity.id) {
      persistenceSchema._id = domainEntity.id;
    }
    persistenceSchema.createdAt = domainEntity.createdAt;
    persistenceSchema.updatedAt = domainEntity.updatedAt;

    return persistenceSchema;
  }
}
