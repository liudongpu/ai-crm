import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('court_holidays')
export class CourtHoliday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  date: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'CN' })
  jurisdiction: string;

  @CreateDateColumn()
  createdAt: Date;
}
