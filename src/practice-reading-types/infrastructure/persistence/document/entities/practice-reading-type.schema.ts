import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { PracticeReadingSchemaClass } from '../../../../../practice-readings/infrastructure/persistence/document/entities/practice-reading.schema';
import { QuestionType } from '../../../../../utils/types/question.type';

export type PracticeReadingTypeSchemaDocument =
  HydratedDocument<PracticeReadingTypeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'practiceReadingType',
})
export class PracticeReadingTypeSchemaClass extends EntityDocumentHelper {
  @Prop({
    ref: PracticeReadingSchemaClass.name,
    type: mongoose.Types.ObjectId,
    required: true,
  })
  practiceReading: PracticeReadingSchemaClass;

  @Prop({ required: true, type: String, enum: Object.values(QuestionType) })
  type: QuestionType;

  @Prop({ required: false, type: String })
  content?: string;

  @Prop({ required: false, type: String })
  image?: string;

  @Prop({ required: false, type: Number })
  limitAnswer?: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const PracticeReadingTypeSchema = SchemaFactory.createForClass(
  PracticeReadingTypeSchemaClass,
);
