import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  packageName: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(['monthly', 'yearly', 'biannually'])
  durationUnit: string;

  @IsOptional()
  @IsString()
  description?: string;
}
