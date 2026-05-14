import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { NFeModalidadeFrete, NFeStatus } from '../../../core/enums/enums';

export class CreateNfeItemDto {
  @IsString() @IsOptional()
  produtoId?: string;

  @IsString() 
  @IsNotEmpty()
  sku: string;

  @IsString() @IsNotEmpty()
  nome: string;

  @IsNumber() @Min(0.001)
  @Type(() => Number)
  qtd: number;

  @IsNumber() @Min(0)
  @Type(() => Number)
  preco: number;

  @IsNumber() @Min(0)
  @IsOptional()
  @Type(() => Number)
  desconto?: number;

  @IsString() @Length(4, 5)
  cfop: string;

  @IsString() @Length(2, 3)
  cst: string;

  @IsNumber() @Min(0)
  @IsOptional()
  @Type(() => Number)
  bcICMS?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  @Type(() => Number)
  aliqICMS?: number;

  @IsNumber() @Min(0)
  @IsOptional()
  @Type(() => Number)
  valorICMS?: number;
}

export class CreateNfeVencimentoDto {
  @IsString() @IsNotEmpty()
  data: string;

  @IsNumber() @Min(0.01)
  @Type(() => Number)
  valor: number;

  @IsString() @IsOptional()
  obs?: string;
}

export class CreateNfeDto {
  @IsString() @IsNotEmpty()
  clientId: string;

  @IsString() @IsNotEmpty()
  dataEmissao: string;

  @IsString() @IsOptional()
  dataSaida?: string;

  @IsString() @IsNotEmpty()
  naturezaOperacao: string;

  @IsString() @IsNotEmpty()
  finalidade: string;

  @IsString() @IsOptional()
  @Length(1, 3)
  serie?: string;

  @IsEnum(NFeStatus) @IsOptional()
  status?: NFeStatus;

  // Valores fiscais
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) baseICMS?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorICMS?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) baseIBS?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorIBS?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorCBS?: number;

  // Totais
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorFrete?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorSeguro?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorDesconto?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorOutro?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) valorTotal?: number;

  // Frete
  @IsEnum(NFeModalidadeFrete) @IsOptional()
  modalidadeFrete?: NFeModalidadeFrete;

  @IsString() @IsOptional() transportadora?: string;
  @IsString() @IsOptional() placaVeiculo?: string;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) pesoLiquido?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) pesoBruto?: number;
  @IsNumber() @Min(0) @IsOptional() @Type(() => Number) qtdVolumes?: number;
  @IsString() @IsOptional() especieVolumes?: string;

  // Observações
  @IsString() @IsOptional() obsContribuinte?: string;
  @IsString() @IsOptional() obsFisco?: string;

  // Complementar
  @IsString() @IsOptional() numeroPedido?: string;
  @IsString() @IsOptional() numeroContrato?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateNfeItemDto)
  items: CreateNfeItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateNfeVencimentoDto)
  vencimentos?: CreateNfeVencimentoDto[];
}
