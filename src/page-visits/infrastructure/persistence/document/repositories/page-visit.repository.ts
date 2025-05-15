import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageVisitSchemaClass } from '../entities/page-visit.schema';
import { PageVisitRepository } from '../../page-visit.repository';
import { PageVisit } from '../../../../domain/page-visit';
import { PageVisitMapper } from '../mappers/page-visit.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class PageVisitDocumentRepository implements PageVisitRepository {
  constructor(
    @InjectModel(PageVisitSchemaClass.name)
    private readonly pageVisitModel: Model<PageVisitSchemaClass>,
  ) {}

  async create(data: PageVisit): Promise<PageVisit> {
    const persistenceModel = PageVisitMapper.toPersistence(data);
    const createdEntity = new this.pageVisitModel(persistenceModel);
    const entityObject = await createdEntity.save();
    return PageVisitMapper.toDomain(entityObject);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<PageVisit[]> {
    const entityObjects = await this.pageVisitModel
      .find()
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .limit(paginationOptions.limit);

    return entityObjects.map((entityObject) =>
      PageVisitMapper.toDomain(entityObject),
    );
  }

  async findById(id: PageVisit['id']): Promise<NullableType<PageVisit>> {
    const entityObject = await this.pageVisitModel.findById(id);
    return entityObject ? PageVisitMapper.toDomain(entityObject) : null;
  }

  async findByIds(ids: PageVisit['id'][]): Promise<PageVisit[]> {
    const entityObjects = await this.pageVisitModel.find({ _id: { $in: ids } });
    return entityObjects.map((entityObject) =>
      PageVisitMapper.toDomain(entityObject),
    );
  }

  async update(
    id: PageVisit['id'],
    payload: Partial<PageVisit>,
  ): Promise<NullableType<PageVisit>> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const entity = await this.pageVisitModel.findOne(filter);

    if (!entity) {
      throw new Error('Record not found');
    }

    const entityObject = await this.pageVisitModel.findOneAndUpdate(
      filter,
      PageVisitMapper.toPersistence({
        ...PageVisitMapper.toDomain(entity),
        ...clonedPayload,
      }),
      { new: true },
    );

    return entityObject ? PageVisitMapper.toDomain(entityObject) : null;
  }

  async remove(id: PageVisit['id']): Promise<void> {
    await this.pageVisitModel.deleteOne({ _id: id });
  }

  async getDailyUserVisits(
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; count: number }[]> {
    // 1. Lấy dữ liệu truy cập theo ngày
    const visits = await this.pageVisitModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
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

    // 2. Tạo map để dễ dàng truy cập số lượng truy cập theo ngày
    const visitsMap = new Map(visits.map((visit) => [visit.date, visit.count]));

    // 3. Tạo danh sách tất cả các ngày trong khoảng thời gian
    const allDays = this.getAllDaysBetween(startDate, endDate);

    // 4. Tạo kết quả cuối cùng với tất cả các ngày
    return allDays.map((date) => ({
      date,
      count: visitsMap.get(date) || 0,
    }));
  }

  // Helper method để tạo danh sách tất cả các ngày trong khoảng thời gian
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
}
