export enum QuestionType {
  //choice
  MultipleChoice = 'multiple-choice',
  SingleChoice = 'single-choice',
  TrueFalseNotGiven = 'true-false-not-given',
  YesNoNotGiven = 'yes-no-not-given',

  //drag
  MatchingHeadings = 'matching-headings',
  MatchingInformation = 'matching-information',
  MatchingFeatures = 'matching-features',
  MatchingSentencesEnding = 'matching-sentences-ending',

  //textbox
  TextBox = 'textbox',
  SentenceCompletion = 'sentence-completion',
  ShortAnswerQuestion = 'short-answer-question',

  //blank
  SummaryCompletion = 'summary-completion',

  // imageTextbox
  DiagramLabelCompletion = 'diagram-label-completion',
  BlankPassageImageTextbox = 'blank-passage-image-textbox',

  TexBoxPosition = 'textbox-position',
  HeadingPosition = 'heading-position',
  BlankPassageDrag = 'blank-passage-drag',
  BlankPassageTextbox = 'blank-passage-textbox',
}
