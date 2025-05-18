import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogRepository } from './infrastructure/persistence/blog.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Blog } from './domain/blog';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BlogGrammarPointsService } from '../blog-grammar-points/blog-grammar-points.service';
import { BlogTopicsService } from '../blog-topics/blog-topics.service';

@Injectable()
export class BlogsService {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly blogTopicsService: BlogTopicsService,
    private readonly blogGrammarPointsService: BlogGrammarPointsService,
  ) {}

  async create(createBlogDto: CreateBlogDto & { image: Express.Multer.File }) {
    const imageResponse = await this.cloudinaryService.uploadImage(
      createBlogDto.image,
    );
    if (imageResponse.http_code)
      throw new InternalServerErrorException('Something went wrong!');
    const blog = await this.blogRepository.create({
      ...createBlogDto,
      image: imageResponse.secure_url,
    });
    const blogId = blog.id;
    if (createBlogDto.topicId) {
      await this.blogTopicsService.create({
        topicId: createBlogDto.topicId,
        blogId,
      });
    }
    if (createBlogDto.grammarPointId) {
      await this.blogGrammarPointsService.create({
        grammarPointId: createBlogDto.grammarPointId,
        blogId,
      });
    }
    return blog;
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.blogRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Blog['id']) {
    return this.blogRepository.findById(id);
  }

  findByIds(ids: Blog['id'][]) {
    return this.blogRepository.findByIds(ids);
  }

  async update(id: Blog['id'], updateBlogDto: UpdateBlogDto) {
    let imageResponse;
    if (updateBlogDto.image) {
      imageResponse = await this.cloudinaryService.uploadImage(
        updateBlogDto.image,
      );
      if (imageResponse.http_code)
        throw new InternalServerErrorException('Something went wrong!');
    }
    return this.blogRepository.update(id, {
      ...updateBlogDto,
      image: imageResponse?.secure_url,
    });
  }

  async remove(id: Blog['id']) {
    await Promise.all([
      this.blogTopicsService.removeByBlogId(id),
      this.blogGrammarPointsService.removeByBlogId(id),
      this.blogRepository.remove(id),
    ]);
  }

  findAllByTopic({
    paginationOptions,
    topicId,
  }: {
    paginationOptions: IPaginationOptions;
    topicId?: string;
  }) {
    return this.blogTopicsService.findAllByTopicIdWithPagination(
      paginationOptions.page,
      paginationOptions.limit,
      topicId,
    );
  }

  findAllByGrammarPoint({
    paginationOptions,
    grammarPointId,
  }: {
    paginationOptions: IPaginationOptions;
    grammarPointId?: string;
  }) {
    return this.blogGrammarPointsService.findAllWithPagination({
      paginationOptions,
      grammarPointId,
    });
  }

  getTotalBlog() {
    return this.blogRepository.getTotalBlog();
  }
}
