import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Request,
  UseGuards,
  Query,
  Delete,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PracticesService } from './practices.service';
import { CreatePracticeDto } from './dto/create-practice.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Practice } from './domain/practice';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';
import { FindAllPracticesDto } from './dto/find-all-practices.dto';
import { paginateData } from '../utils/paginate';
import {
  SubmitPracticeDto,
  SubmitPracticeWritingDto,
} from './dto/submit-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';

@ApiTags('Practices')
@Controller({
  path: 'practices',
  version: '1',
})
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Post()
  @ApiCreatedResponse({
    type: Practice,
  })
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createPracticeDto: CreatePracticeDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.practicesService.create({ ...createPracticeDto, image });
  }

  @Get('start-practice/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  startExam(@Param('id') id: string, @Request() request) {
    const userId = request.user.id;
    return this.practicesService.startPractice(id, userId);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Practice),
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query() query: FindAllPracticesDto, @Request() request) {
    const userId = request.user.id;
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }
    const practices = await this.practicesService.findAllWithPagination({
      userId,
      ...query,
    });
    return paginateData(practices, page, limit);
  }

  @Get('total-practice')
  getTotalPractice() {
    return this.practicesService.getTotalPractice();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  getPractice(@Param('id') id: string, @Request() request) {
    const userId = request.user?.id;
    return this.practicesService.getUserPractice(id, userId);
  }

  @Post('submit/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({ isArray: true, type: [SubmitPracticeDto] })
  submitPractice(
    @Param('id') id: string,
    @Request() request,
    @Body() submitPracticeDto: SubmitPracticeDto[] | SubmitPracticeWritingDto,
  ) {
    const userId = request.user.id;
    return this.practicesService.submitPractice(id, userId, submitPracticeDto);
  }

  @Get('summary/:id')
  getPracticeSummary(@Param('id') id: string) {
    return this.practicesService.getSummaryByPracticeId(id);
  }

  @Post('/exit/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  exitPractice(
    @Param('id') id: string,
    @Request() request,
    @Body() submitPracticeDto: SubmitPracticeDto[] | SubmitPracticeWritingDto,
  ) {
    const userId = request.user.id;
    return this.practicesService.exitPractice(id, userId, submitPracticeDto);
  }

  @Get('detail/:id')
  getPracticeDetail(@Param('id') id: string) {
    return this.practicesService.getPracticeDetail(id);
  }

  @Get('detail-practice-type/:id')
  getPracticeDetailType(@Param('id') id: string) {
    return this.practicesService.getPracticeDetailType(id);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.practicesService.remove(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ transform: true }))
  update(
    @Param('id') id: string,
    @Body() updatePracticeDto: UpdatePracticeDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.practicesService.update(id, {
      ...updatePracticeDto,
      image,
    });
  }
}
