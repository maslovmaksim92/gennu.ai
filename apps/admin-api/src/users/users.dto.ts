import { IsBoolean, IsEmail, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  email!: string;

  @IsIn(['ACTIVE', 'BLOCKED', 'INVITED'])
  status!: 'ACTIVE' | 'BLOCKED' | 'INVITED';

  @IsBoolean()
  emailVerified!: boolean;
}

export class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED'])
  status!: 'ACTIVE' | 'BLOCKED';
}
