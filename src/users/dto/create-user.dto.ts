import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';
import { StatusEnum } from '../infrastructure/persistence/document/entities/user.schema';
import { Account } from '../../accounts/domain/account';

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John', type: String })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: '123 Main St, Springfield, USA',
    required: false,
  })
  address?: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @IsOptional()
  phone: string | null;

  @ApiProperty()
  @IsNotEmpty()
  account: Account;

  @ApiProperty({ example: StatusEnum.Active })
  status: StatusEnum;
}
