import { Type } from 'class-transformer';
import {
  IsEmail, IsIn, IsInt, IsOptional, IsPositive, IsString, ValidateNested,
} from 'class-validator';

class PayerIdentificationDto {
  @IsString() type: string;   // 'CPF' | 'CNPJ'
  @IsString() number: string;
}

/**
 * Espelha o discriminado por `paymentType` que o Payment Brick devolve em
 * onSubmit — creditCard/debitCard trazem token+installments, ticket (boleto)
 * e bank_transfer (PIX) trazem só payment_method_id+payer. `transaction_amount`
 * do formData do Brick é ignorado de propósito — o valor cobrado vem sempre
 * de fatura.valor no backend (ver FaturasService.pagar).
 */
export class PagarFaturaDto {
  @IsIn(['creditCard', 'debitCard', 'ticket', 'bank_transfer'])
  paymentType: 'creditCard' | 'debitCard' | 'ticket' | 'bank_transfer';

  @IsString()
  paymentMethodId: string; // 'visa' | 'master' | 'pix' | 'bolbradesco' etc.

  @IsOptional() @IsString()
  token?: string; // cartão

  @IsOptional() @IsInt() @IsPositive()
  installments?: number; // cartão

  @IsOptional() @IsInt()
  issuerId?: number; // cartão

  @IsEmail()
  payerEmail: string;

  @IsOptional() @ValidateNested() @Type(() => PayerIdentificationDto)
  payerIdentification?: PayerIdentificationDto; // obrigatório na prática p/ boleto/PIX
}
