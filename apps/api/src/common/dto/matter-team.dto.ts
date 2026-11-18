import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  MATTER_TEAM_ROLES,
  PARTY_ROLES,
  MatterTeamRole,
  PartyRole,
} from '../../database/entities';

export class CreatePartyDto {
  @IsIn(PARTY_ROLES)
  role: PartyRole;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdatePartyDto {
  @IsOptional()
  @IsIn(PARTY_ROLES)
  role?: PartyRole;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTeamMemberDto {
  @IsInt()
  userId: number;

  @IsIn(MATTER_TEAM_ROLES)
  role: MatterTeamRole;

  @IsOptional()
  @IsBoolean()
  canViewInternal?: boolean;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsIn(MATTER_TEAM_ROLES)
  role?: MatterTeamRole;

  @IsOptional()
  @IsBoolean()
  canViewInternal?: boolean;
}
