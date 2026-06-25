import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfig } from './entities/tenant-config.entity';
import { UpsertTenantConfigDto } from './dto/upsert-tenant-config.dto';

@Injectable()
export class TenantConfigService {
  constructor(
    @InjectRepository(TenantConfig)
    private readonly repo: Repository<TenantConfig>,
  ) {}

  async get(tenantId: string): Promise<TenantConfig | null> {
    return this.repo.findOneBy({ tenantId });
  }

  async upsert(tenantId: string, dto: UpsertTenantConfigDto): Promise<TenantConfig> {
    let config = await this.repo.findOneBy({ tenantId });

    if (config) {
      Object.assign(config, dto);
    } else {
      config = this.repo.create({ tenantId, ...dto });
    }

    return this.repo.save(config);
  }

  private mapConfig(c: TenantConfig) {
    return {
      id: c.id,
      nomeFantasia:        c.nomeFantasia,
      ie:                  c.ie,
      im:                  c.im,
      cnae:                c.cnae,
      telefone:            c.telefone,
      emailComercial:      c.emailComercial,
      cep:                 c.cep,
      logradouro:          c.logradouro,
      numero:              c.numero,
      complemento:         c.complemento,
      bairro:              c.bairro,
      cidade:              c.cidade,
      uf:                  c.uf,
      crt:                 c.crt,
      serieNfe:            c.serieNfe,
      ambienteNfe:         c.ambienteNfe,
      cfopPadrao:          c.cfopPadrao,
      cstPadrao:           c.cstPadrao,
      aliqIcms:            c.aliqIcms,
      aliqIbs:             c.aliqIbs,
      aliqCbs:             c.aliqCbs,
      emailNfe:            c.emailNfe,
      // Certificado: oculta o base64 e a senha na resposta
      certificadoNome:     c.certificadoNome,
      certificadoValidade: c.certificadoValidade,
      temCertificado:      !!c.certificadoBase64,
    };
  }

  async getForApi(tenantId: string) {
    const c = await this.repo.findOneBy({ tenantId });
    if (!c) return null;
    return this.mapConfig(c);
  }

  async upsertForApi(tenantId: string, dto: UpsertTenantConfigDto) {
    const saved = await this.upsert(tenantId, dto);
    return this.mapConfig(saved);
  }
}
