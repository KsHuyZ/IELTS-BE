import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { QuestionType } from '../../../../../utils/types/question.type';
import { PracticeListenSchemaClass } from '../../../../../practice-listens/infrastructure/persistence/document/entities/practice-listen.schema';

export type PracticeListenTypeSchemaDocument =
  HydratedDocument<PracticeListenTypeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'practiceListenType',
})
export class PracticeListenTypeSchemaClass extends EntityDocumentHelper {
  @Prop({ type: String, required: true })
  type: QuestionType;

  @Prop({
    type: mongoose.Types.ObjectId,
    required: true,
    ref: PracticeListenSchemaClass.name,
  })
  practiceListen: PracticeListenSchemaClass;

  @Prop({ required: false })
  content?: string;

  @Prop({ required: false, type: Number })
  limitAnswer?: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const PracticeListenTypeSchema = SchemaFactory.createForClass(
  PracticeListenTypeSchemaClass,
);
