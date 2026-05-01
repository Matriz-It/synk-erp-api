import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function clean(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function validateCPF(cpf: string): boolean {
  const d = clean(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +d[i] * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== +d[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += +d[i] * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === +d[10];
}

function validateCNPJ(cnpj: string): boolean {
  const d = clean(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += +d[i] * pos--;
    if (pos < 2) pos = 9;
  }
  let rem = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (rem !== +d[12]) return false;

  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += +d[i] * pos--;
    if (pos < 2) pos = 9;
  }
  rem = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return rem === +d[13];
}

@ValidatorConstraint({ name: 'isCpf', async: false })
class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && validateCPF(value);
  }
  defaultMessage() {
    return 'CPF inválido';
  }
}

@ValidatorConstraint({ name: 'isCnpj', async: false })
class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && validateCNPJ(value);
  }
  defaultMessage() {
    return 'CNPJ inválido';
  }
}

export function IsCpf(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsCpfConstraint,
    });
}

export function IsCnpj(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsCnpjConstraint,
    });
}
