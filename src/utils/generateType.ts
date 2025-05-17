import { QuestionType } from './types/question.type';

export const generateType = (type: QuestionType) => {
  switch (type) {
    case QuestionType.MultipleChoice:
    case QuestionType.TrueFalseNotGiven:
    case QuestionType.YesNoNotGiven:
    case QuestionType.SingleChoice:
      return QuestionType.SingleChoice;

    case QuestionType.MatchingHeadings:
    case QuestionType.MatchingInformation:
    case QuestionType.MatchingFeatures:
    case QuestionType.MatchingSentencesEnding:
    case QuestionType.BlankPassageDrag:
      return QuestionType.BlankPassageDrag;

    case QuestionType.SentenceCompletion:
    case QuestionType.TextBox:
    case QuestionType.ShortAnswerQuestion:
      return QuestionType.TextBox;

    case QuestionType.SummaryCompletion:
    case QuestionType.BlankPassageTextbox:
      return QuestionType.BlankPassageTextbox;

    case QuestionType.DiagramLabelCompletion:
    case QuestionType.BlankPassageImageTextbox:
      return QuestionType.BlankPassageImageTextbox;
  }
};
