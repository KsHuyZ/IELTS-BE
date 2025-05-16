import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument, Types } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { ExamListenSectionSchemaClass } from '../../../../../exam-listen-sections/infrastructure/persistence/document/entities/exam-listen-section.schema';
import { QuestionType } from '../../../../../utils/types/question.type';

export type ExamListenTypeSchemaDocument =
  HydratedDocument<ExamListenTypeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'examListenType',
})
export class ExamListenTypeSchemaClass extends EntityDocumentHelper {
  @Prop({
    required: true,
    ref: ExamListenSectionSchemaClass.name,
    type: Types.ObjectId,
  })
  examSection: ExamListenSectionSchemaClass;

  @Prop({ required: true, type: String, enum: Object.values(QuestionType) })
  type: QuestionType;

  @Prop({ required: false, type: String })
  content?: string;

  @Prop({ required: false, type: Number })
  limitAnswer?: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ExamListenTypeSchema = SchemaFactory.createForClass(
  ExamListenTypeSchemaClass,
);
