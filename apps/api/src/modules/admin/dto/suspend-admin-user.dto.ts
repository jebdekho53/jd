import { IsString, Length } from 'class-validator';

export class SuspendAdminUserDto {
  @IsString()
  @Length(3, 500)
  reason: string;
}
