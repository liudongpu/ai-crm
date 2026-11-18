import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoteDto, UpdateNoteDto } from '../../common/dto/create-note.dto';
import { Note } from '../../database/entities';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly notes: Repository<Note>,
  ) {}

  findAll(params: { targetType?: string; targetId?: number } = {}) {
    const qb = this.notes.createQueryBuilder('note');

    if (params.targetType) {
      qb.andWhere('note.targetType = :targetType', { targetType: params.targetType });
    }
    if (params.targetId !== undefined) {
      qb.andWhere('note.targetId = :targetId', { targetId: params.targetId });
    }

    return qb.orderBy('note.createdAt', 'DESC').getMany();
  }

  async findOne(id: number) {
    const note = await this.notes.findOne({ where: { id } });
    if (!note) throw new NotFoundException(`备注 ${id} 不存在`);
    return note;
  }

  create(dto: CreateNoteDto) {
    return this.notes.save(this.notes.create(dto));
  }

  async update(id: number, dto: UpdateNoteDto) {
    const note = await this.findOne(id);
    Object.assign(note, dto);
    return this.notes.save(note);
  }

  async remove(id: number) {
    const note = await this.findOne(id);
    await this.notes.remove(note);
    return { id };
  }
}
