import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { ExamPassageSchemaClass } from '../../../../../exam-passages/infrastructure/persistence/document/entities/exam-passage.schema';
import { QuestionType } from '../../../../../utils/types/question.type';

export type ExamReadingTypeSchemaDocument =
  HydratedDocument<ExamReadingTypeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
  collection: 'examReadingType',
})
export class ExamReadingTypeSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: ExamPassageSchemaClass.name,
    required: true,
  })
  examPassage: ExamPassageSchemaClass;

  @Prop({
    type: String,
    enum: Object.values(QuestionType),
    required: true,
  })
  type: QuestionType;

  @Prop({ type: String, required: false })
  content?: string;

  @Prop({ type: String, required: false })
  image?: string;

  @Prop({ type: Number, required: false })
  limitAnswer?: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ExamReadingTypeSchema = SchemaFactory.createForClass(
  ExamReadingTypeSchemaClass,
);
