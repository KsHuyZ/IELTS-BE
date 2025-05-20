import { Injectable } from '@nestjs/common';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserSchemaClass } from '../entities/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model, Promise } from 'mongoose';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { RoleEnum } from '../../../../../accounts/infrastructure/persistence/document/entities/account.schema';
import { InfinityPaginationResponseDto } from '../../../../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../../../../utils/infinity-pagination';

@Injectable()
export class UsersDocumentRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly usersModel: Model<UserSchemaClass>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    const createdUser = new this.usersModel(persistenceModel);
    const userObject = await createdUser.save();
    return UserMapper.toDomain(userObject);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<InfinityPaginationResponseDto<User>> {
    const where: FilterQuery<UserSchemaClass> = {};

    if (filterOptions?.name) {
      where.name = { $regex: '.*' + filterOptions.name + '.*' };
    }
    const { limit, page } = paginationOptions;
    const userObjects = await this.usersModel
      .find(where)
      .populate({
        path: 'account',
        match: {
          role: filterOptions?.role ?? {
            $in: [RoleEnum.Learner, RoleEnum.Teacher],
          },
        },
      })
      .sort(
        sortOptions?.reduce(
          (accumulator, sort) => ({
            ...accumulator,
            [sort.orderBy === 'id' ? '_id' : sort.orderBy]:
              sort.order.toUpperCase() === 'ASC' ? 1 : -1,
          }),
          {},
        ),
      )
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    const total = await this.usersModel.countDocuments(where);

    return infinityPagination(userObjects.map(UserMapper.toDomain), {
      total,
      page,
      limit,
    });
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const userObject = await this.usersModel.findById(
      new mongoose.Types.ObjectId(id),
    );
    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const userObjects = await this.usersModel.find({ _id: { $in: ids } });
    return userObjects.map((userObject) => UserMapper.toDomain(userObject));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    const userObject = await this.usersModel
      .findOne({ email })
      .populate('account');
    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const user = await this.usersModel.findOne(filter);

    if (!user) {
      return null;
    }

    const userObject = await this.usersModel.findOneAndUpdate(
      filter,
      UserMapper.toPersistence({
        ...UserMapper.toDomain(user),
        ...clonedPayload,
      }),
      { new: true },
    );

    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersModel.deleteOne({
      _id: id.toString(),
    });
  }

  async findByAccountId(
    accountId: User['account']['id'],
  ): Promise<NullableType<User>> {
    const user = await this.usersModel
      .findOne({ account: { _id: accountId } })
      .populate('account');
    return user ? UserMapper.toDomain(user) : null;
  }

  private getAllMonthsBetween(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      months.push(`${year}-${month < 10 ? '0' + month : month}`);

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }

  private getAllDaysBetween(startDate: Date, endDate: Date): string[] {
    const days: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      days.push(
        `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`,
      );

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  async getUserRegistrationByMonth(
    startDate: Date = new Date(new Date().getFullYear(), 0, 1), // Mặc định lấy từ đầu năm hiện tại
    endDate: Date = new Date(),
  ): Promise<{ day: string; count: number }[]> {
    const result = await this.usersModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          // Có thể thêm điều kiện status: StatusEnum.Active nếu chỉ muốn đếm user active
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
          '_id.day': 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.day', 10] },
                  then: { $concat: ['0', { $toString: '$_id.day' }] },
                  else: { $toString: '$_id.day' },
                },
              },
            ],
          },
          count: 1,
        },
      },
    ]);

    // Đảm bảo tất cả các tháng đều có dữ liệu (kể cả tháng không có đăng ký)
    const allDays = this.getAllDaysBetween(startDate, endDate);
    const resultMap = new Map(result.map((item) => [item.date, item.count]));

    return allDays.map((day) => ({
      day,
      count: resultMap.get(day) || 0,
    }));
  }
}
