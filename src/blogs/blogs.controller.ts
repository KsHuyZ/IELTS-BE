import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  Query,
  Delete,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Blog } from './domain/blog';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../accounts/infrastructure/persistence/document/entities/account.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';
import { FindAllBlogTopicDto } from './dto/find-all-blog-topic.dto';
import { FindAllBlogGrammarPointDto } from './dto/find-all-blog-grammar-point.dto';
@ApiTags('Blogs')
@ApiBearerAuth()
@Controller({
  path: 'blogs',
  version: '1',
})
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Blog,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFile()
    image: Express.Multer.File,
  ) {
    return this.blogsService.create({ ...createBlogDto, image });
  }
  @ApiOkResponse({
    type: InfinityPaginationResponse(Blog),
  })
  @Get('topic')
  @HttpCode(HttpStatus.OK)
  async findAllByTopic(
    @Query() query: FindAllBlogTopicDto,
  ): Promise<InfinityPaginationResponseDto<Blog>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    const topicId = query?.topicId;
    if (limit > 50) {
      limit = 50;
    }

    return this.blogsService.findAllByTopic({
      paginationOptions: {
        page,
        limit,
      },
      topicId,
    });
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Blog),
  })
  @Get('grammar-point')
  async findAllByGrammarPoint(@Query() query: FindAllBlogGrammarPointDto) {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    const grammarPointId = query?.grammarPointId;
    if (limit > 50) {
      limit = 50;
    }
    return this.blogsService.findAllByGrammarPoint({
      paginationOptions: {
        page,
        limit,
      },
      grammarPointId,
    });
  }

  @Get('total-blog')
  getTotalBlog() {
    return this.blogsService.getTotalBlog();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Blog,
  })
  findById(@Param('id') id: string) {
    return this.blogsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Blog,
  })
  @UseInterceptors(FileInterceptor('image'))
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Blog,
  })
  @Roles(RoleEnum.Teacher, RoleEnum.Admin)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
