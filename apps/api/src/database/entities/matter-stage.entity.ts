import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('matter_stages')
export class MatterStage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ type: 'integer', default: 0 })
  probability: number;

  @Column({ default: false })
  isFinal: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
