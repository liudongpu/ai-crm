import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../../../common/crud.service';
import { NoteQueryDto } from '../../../common/dto/special.dto';
import { Note } from '../../../database/entities';

@Injectable()
export class NotesService extends CrudService<Note> {
  constructor(@InjectRepository(Note) repo: Repository<Note>) {
    super(repo);
  }

  async findAll(query: NoteQueryDto = {}) {
    const qb = this.repo.createQueryBuilder('note');

    if (query.targetType !== undefined) {
      qb.andWhere('note.targetType = :targetType', { targetType: query.targetType });
    }
    if (query.targetId !== undefined) {
      qb.andWhere('note.targetId = :targetId', { targetId: query.targetId });
    }

    return qb.orderBy('note.createdAt', 'DESC').getMany();
  }
}
