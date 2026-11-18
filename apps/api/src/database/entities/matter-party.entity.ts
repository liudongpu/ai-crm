import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const PARTY_ROLES = ['plaintiff', 'defendant', 'third_party', 'other'] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

/** 案件当事人：原告 / 被告 / 第三人。 */
@Entity('matter_parties')
export class MatterParty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  matterId: number;

  @Column({ type: 'varchar', default: 'plaintiff' })
  role: PartyRole;

  @Column()
  name: string;

  /** 身份证号 / 统一社会信用代码（可选）。 */
  @Column({ type: 'varchar', nullable: true })
  idNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  contact: string | null;

  @Column({ type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
