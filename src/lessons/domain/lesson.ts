import { ApiProperty } from '@nestjs/swagger';
import { LessonType } from '../lessons.type';
import { Blog } from '../../blogs/domain/blog';

export class Lesson {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: LessonType;

  @ApiProperty()
  videoId?: string;

  @ApiProperty()
  blog?: Blog;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
