import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const COMMUNICATION_TYPES = ['email', 'sms', 'call', 'meeting', 'message', 'letter'] as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

export const COMMUNICATION_DIRECTIONS = ['inbound', 'outbound'] as const;
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];

@Entity('communications')
export class Communication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  matterId: number | null;

  @Column({ type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ type: 'integer', nullable: true })
  contactId: number | null;

  @Column({ type: 'varchar' })
  type: CommunicationType;

  @Column({ type: 'varchar' })
  direction: CommunicationDirection;

  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime' })
  occurredAt: Date;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
