import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompanyDto, UpdateCompanyDto } from '../../common/dto/create-company.dto';
import { Company } from '../../database/entities';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companies: Repository<Company>,
  ) {}

  findAll() {
    return this.companies.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`公司 ${id} 不存在`);
    return company;
  }

  create(dto: CreateCompanyDto) {
    return this.companies.save(this.companies.create(dto));
  }

  async update(id: number, dto: UpdateCompanyDto) {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companies.save(company);
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    await this.companies.remove(company);
    return { id };
  }
}
