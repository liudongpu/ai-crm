import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('feature_modules')
export class FeatureModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'integer', default: 0 })
  position: number;
}
