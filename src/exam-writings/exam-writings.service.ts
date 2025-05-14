import { Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { CreateExamWritingDto } from './dto/create-exam-writing.dto';
import { UpdateExamWritingDto } from './dto/update-exam-writing.dto';
import { ExamWritingRepository } from './infrastructure/persistence/exam-writing.repository';
import { ExamWriting } from './domain/exam-writing';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Exam } from '../exams/domain/exam';
import { User } from '../users/domain/user';
import { UserExamWritingsService } from '../user-exam-writings/user-exam-writings.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class ExamWritingsService {
  private openai: OpenAI;
  constructor(
    private readonly examWritingRepository: ExamWritingRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userExamWritingService: UserExamWritingsService,
    private configService: ConfigService,
  ) {
    const openaiApiKey = this.configService.get('app.openaiApiKey', {
      infer: true,
    });
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is not set');
    }
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async create(createExamWritingDto: CreateExamWritingDto) {
    const { content, examId, image } = createExamWritingDto;
    const exam = new Exam();
    exam.id = examId;
    if (!image) {
      return this.examWritingRepository.create({ exam, content });
    }
    const { secure_url } = await this.cloudinaryService.uploadImage(image);
    const base64Image = image.buffer.toString('base64');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze the image and provide a detailed description of the image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
    return this.examWritingRepository.create({
      exam,
      content,
      image: secure_url,
      imageDetails: response.choices[0].message.content || undefined,
    });
  }

  findById(id: ExamWriting['id']) {
    return this.examWritingRepository.findById(id);
  }

  findByIds(ids: ExamWriting['id'][]) {
    return this.examWritingRepository.findByIds(ids);
  }

  async update(
    id: ExamWriting['id'],
    updateExamWritingDto: UpdateExamWritingDto,
  ) {
    const { content, image } = updateExamWritingDto;
    if (!image) {
      return this.examWritingRepository.update(id, { content });
    }
    const { secure_url } = await this.cloudinaryService.uploadImage(image);
    const base64Image = image.buffer.toString('base64');
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze the image and provide a detailed description of the image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });
    return this.examWritingRepository.update(id, {
      content,
      image: secure_url,
      imageDetails: response.choices[0].message.content || undefined,
    });
  }

  remove(id: ExamWriting['id']) {
    return this.examWritingRepository.remove(id);
  }

  findByExamId(id: string) {
    return this.examWritingRepository.findByExamId(id);
  }

  async findAllByExamIdAndUserId(id: string, userId: User['id']) {
    const examWriting = await this.examWritingRepository.findByExamId(id);
    const answers = await this.userExamWritingService.findByUserIdAndExamId(
      userId,
      id,
    );
    return examWriting.map((examWriting) => {
      const answer = answers.find(
        (answer) => answer.examWriting.id === examWriting.id,
      );

      return { ...examWriting, answer };
    });
  }

  async findAllByExamId(id: string) {
    const examWriting = await this.examWritingRepository.findByExamId(id);
    return examWriting;
  }

  async gradeEssayExamWriting(essay: string, id: string, taskNumber: number) {
    const examWriting = await this.examWritingRepository.findById(id);
    if (!examWriting) {
      throw new NotFoundException('Exam writing not found');
    }
    const { content: question, imageDetails } = examWriting;
    return this.gradeEssay(essay, question, taskNumber, imageDetails);
  }

  async gradeEssay(
    essay: string,
    question: string,
    taskNumber: number,
    imageDetails?: string,
  ) {
    const prompt = `
      
      You are a certified IELTS Writing Task ${taskNumber} examiner.
      
      Below is an IELTS Writing Task ${taskNumber} question and a candidate's response. The chart referenced is provided in the image.
      
      Please evaluate the response according to the IELTS Writing Task ${taskNumber} Band Descriptors, across the following four criteria:
      
      ---
      
      1. Task Achievement (TA)  
        Evaluate how well the candidate:
        - Covers all key features of the visual/chart.
        - Summarizes and compares relevant data appropriately.
        - Uses a clear overview and supports with specific data.
        - Avoids irrelevant details or inaccuracies.
      
        Band Descriptors:
        - Band 9: Fully satisfies all task requirements. Presents a clear overview, highlights all key features with accurate, well-selected data, and makes relevant comparisons.
        - Band 8: Satisfies all task requirements. Provides a clear overview and includes relevant details with accurate data, but may be a little imbalanced in the coverage.
        - Band 7: Covers most key features but misses some minor trends. Data support is adequate though slightly imbalanced.
        - Band 6: Addresses the task but includes some irrelevant or inaccurate detail. Overview may be unclear or missing, and comparisons may lack clarity.
        - Band 5: May only partially cover key features or have significant inaccuracies or irrelevant details. The overview may be absent.
        - Band 4: Task is only partially addressed, with many inaccuracies or irrelevant details. Overview is either absent or very vague.
        - Band 3: Incomplete response that does not fully address the task. Few key features are included.
        - Band 2: Very limited response that does not address the task appropriately.
        - Band 1: Essentially no attempt to address the task.
      
      ---
      
      2. Coherence and Cohesion (CC)  
        Assess how well the essay:
        - Organizes ideas logically and clearly.
        - Uses cohesive devices appropriately.
        - Paragraphs ideas effectively.
      
        Band Descriptors:
        - Band 9: Sequences information and ideas logically with clear cohesion. Paragraphing is appropriate, and ideas are well linked.
        - Band 8: Clear organization of information with a logical progression of ideas. Cohesion is effective and paragraphing is clear.
        - Band 7: Organizes ideas logically, but cohesion may be limited or awkward in places. Paragraphing is generally clear but may not always be fully effective.
        - Band 6: Ideas are logically organized but cohesion may be forced. Paragraphing is present but not always clear, and linking devices may be overused.
        - Band 5: Ideas are not logically organized or show limited cohesion. Paragraphing may be faulty or inconsistent.
        - Band 4: Information is poorly organized, and cohesion is lacking. Paragraphing is unclear or absent.
        - Band 3: Very limited cohesion and organization. Paragraphs are poorly constructed or do not exist.
        - Band 2: No clear organization or cohesion in ideas.
        - Band 1: No organization or cohesion at all.
      
      ---
      
      3. Lexical Resource (LR)  
        Evaluate the range and accuracy of vocabulary:
        - Appropriate use of academic and task-related vocabulary.
        - Paraphrasing of task language.
        - Avoiding repetition and using collocations properly.
      
        Band Descriptors:
        - Band 9: Wide range of vocabulary used with flexibility and accuracy. Very few, if any, errors in word choice.
        - Band 8: Sufficient range of vocabulary used flexibly with occasional inaccuracies. Very few repetitions.
        - Band 7: A good range of vocabulary with some flexibility, but occasional inaccuracies or awkward phrasing.
        - Band 6: Limited range of vocabulary, with some repetitive phrases. Some inaccuracies and awkward word choices.
        - Band 5: Frequent repetition of words or phrases. Some errors in word choice or collocations.
        - Band 4: Limited vocabulary with frequent errors and misuse of words.
        - Band 3: Very limited vocabulary, mostly inappropriately used.
        - Band 2: Extremely limited vocabulary.
        - Band 1: Essentially no range of vocabulary.
      
      ---
      
      4. Grammatical Range and Accuracy (GRA)  
        Analyze:
        - Variety and complexity of grammatical structures.
        - Frequency and types of errors.
        - Sentence control and punctuation.
      
        Band Descriptors:
        - Band 9: Wide range of structures with very few errors. Sentences are well-controlled, and punctuation is accurate.
        - Band 8: A good range of grammatical structures with only a few errors. Errors do not impede communication.
        - Band 7: A variety of sentence structures with some errors. The errors are noticeable but do not obscure meaning.
        - Band 6: A mix of simple and complex sentence forms, but some errors are noticeable and may cause slight confusion.
        - Band 5: Some complex structures are attempted, but errors may affect understanding. Frequent mistakes in grammar.
        - Band 4: Simple sentence structures used predominantly. Many errors in grammar and punctuation.
        - Band 3: Very limited use of sentence structures. Frequent and serious grammatical errors.
        - Band 2: Grammatical structures are almost nonexistent.
        - Band 1: No appropriate grammatical structures used.
      
      ---
      
      ### What to Return
      
      For each criterion:
      - Assign a band score (1 - 9)
      - Provide a detailed explanation of the score, based on the official IELTS descriptors
      
      Finally:
      - Compute the overall band score as the average of the four (rounded to the nearest 0.5)
      
      ---
      Return the result strictly as a valid JSON object with this structure:

      {
        "taskResponse": {
          "score": number,
          "comment": string
        },
        "coherenceAndCohesion": {
          "score": number,
          "comment": string
        },
        "lexicalResource": {
          "score": number,
          "comment": string
        },
        "grammaticalRangeAndAccuracy": {
          "score": number,
          "comment": string
        },
        "overallBandScore": number
      }
      
      ---
      
      Writing Task ${taskNumber} Question:
      """
      ${question}
      """
      Here is a description of an image that has already been analyzed:
      """
      ${imageDetails}
      """
      ---
      
      Candidate's Essay:
      """
      ${essay}
      """
      
      Begin your evaluation below.
    `;
    const response = await this.openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: [{ role: 'user', content: prompt }],
    });
    return JSON.parse(response.choices[0].message.content || '{}') as {
      taskResponse: {
        score: number;
        comment: string;
      };
      coherenceAndCohesion: {
        score: number;
        comment: string;
      };
      lexicalResource: {
        score: number;
        comment: string;
      };
      grammaticalRangeAndAccuracy: {
        score: number;
        comment: string;
      };
      overallBandScore: number;
    };
  }
}
