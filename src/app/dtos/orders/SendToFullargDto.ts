import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

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

  /**
   * Unidades (tarjetas sueltas) a mandar. Si no viene, se calculan desde la
   * orden (cantidad × tarjetas del pack). Sirve para regalos o envíos extra.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;
}
