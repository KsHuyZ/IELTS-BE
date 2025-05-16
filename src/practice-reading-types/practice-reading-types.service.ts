import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePracticeReadingTypeDto } from './dto/create-practice-reading-type.dto';
import { UpdatePracticeReadingTypeDto } from './dto/update-practice-reading-type.dto';
import { PracticeReadingTypeRepository } from './infrastructure/persistence/practice-reading-type.repository';
import { PracticeReadingType } from './domain/practice-reading-type';
import { PracticeReadingsService } from '../practice-readings/practice-readings.service';
import { PracticeReadingQuestionsService } from '../practice-reading-questions/practice-reading-questions.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class PracticeReadingTypesService {
  constructor(
    private readonly practiceReadingTypeRepository: PracticeReadingTypeRepository,
    @Inject(forwardRef(() => PracticeReadingsService))
    private readonly practiceReadingsService: PracticeReadingsService,
    private readonly practiceReadingQuestionsService: PracticeReadingQuestionsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createPracticeReadingTypeDto: CreatePracticeReadingTypeDto) {
    const { practiceReadingId, image, ...rest } = createPracticeReadingTypeDto;
    const practiceReading =
      await this.practiceReadingsService.findById(practiceReadingId);
    if (!practiceReading)
      throw new NotFoundException('Practice reading not found');
    let imageResponse: string | undefined;
    if (image) {
      const { secure_url } = await this.cloudinaryService.uploadImage(image);
      imageResponse = secure_url;
    }
    return this.practiceReadingTypeRepository.create({
      practiceReading,
      ...rest,
      image: imageResponse,
    });
  }

  findById(id: PracticeReadingType['id']) {
    return this.practiceReadingTypeRepository.findById(id);
  }

  findByIds(ids: PracticeReadingType['id'][]) {
    return this.practiceReadingTypeRepository.findByIds(ids);
  }

  async findByPracticeReadingId(id: string) {
    const types =
      await this.practiceReadingTypeRepository.findByPracticeReadingId(id);
    return Promise.all(
      types.map(async (type) => {
        const questions =
          await this.practiceReadingQuestionsService.findByTypeId(type.id);
        return {
          type: type.type,
          id: type.id,
          questions,
          content: type.content,
          image: type.image,
          limitAnswer: type.limitAnswer,
        };
      }),
    );
  }

  async update(
    id: PracticeReadingType['id'],
    updatePracticeReadingTypeDto: UpdatePracticeReadingTypeDto,
  ) {
    const { image, ...rest } = updatePracticeReadingTypeDto;
    let imageResponse: string | undefined;
    if (image) {
      const { secure_url } = await this.cloudinaryService.uploadImage(image);
      imageResponse = secure_url;
    }
    return this.practiceReadingTypeRepository.update(id, {
      ...rest,
      image: imageResponse,
    });
  }

  remove(id: PracticeReadingType['id']) {
    return this.practiceReadingTypeRepository.remove(id);
  }
}
