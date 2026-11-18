import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FeatureModule } from './feature-module.entity';

@Entity('features')
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  moduleId: number;

  @ManyToOne(() => FeatureModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: FeatureModule;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'varchar' })
  route: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ default: true })
  enabled: boolean;
}
