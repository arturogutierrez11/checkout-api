import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class SendToFullargDto {
  /**
   * Operador logístico / modalidad con la que Fullarg despacha (se manda como
   * `shipping_method`). Si no viene, Fullarg decide.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9 _.\-]+$/)
  shippingMethod?: string;
}
