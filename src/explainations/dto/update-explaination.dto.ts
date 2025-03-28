// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateExplainationDto } from './create-explaination.dto';

export class UpdateExplainationDto extends PartialType(CreateExplainationDto) {}
