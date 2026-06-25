import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantConfigs1786000000000 implements MigrationInterface {
  name = 'AddTenantConfigs1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant_configs" (
        "id"                   uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id"            uuid                     NOT NULL,
        "nome_fantasia"        character varying(150),
        "ie"                   character varying(20),
        "im"                   character varying(20),
        "cnae"                 character varying(10),
        "telefone"             character varying(20),
        "email_comercial"      character varying(100),
        "cep"                  character varying(9),
        "logradouro"           character varying(150),
        "numero"               character varying(20),
        "complemento"          character varying(100),
        "bairro"               character varying(100),
        "cidade"               character varying(100),
        "uf"                   character varying(2),
        "crt"                  character varying(1),
        "serie_nfe"            character varying(3)      DEFAULT '1',
        "ambiente_nfe"         character varying(20)     DEFAULT 'homologacao',
        "cfop_padrao"          character varying(5),
        "cst_padrao"           character varying(3),
        "aliq_icms"            numeric(5,2),
        "aliq_ibs"             numeric(5,2),
        "aliq_cbs"             numeric(5,2),
        "email_nfe"            character varying(100),
        "certificado_base64"   text,
        "certificado_senha"    character varying(100),
        "certificado_validade" character varying(10),
        "certificado_nome"     character varying(100),
        CONSTRAINT "UQ_tenant_configs_tenant_id" UNIQUE ("tenant_id"),
        CONSTRAINT "PK_tenant_configs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "tenant_configs" ADD CONSTRAINT "FK_tenant_configs_tenant"
       FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenant_configs" DROP CONSTRAINT "FK_tenant_configs_tenant"`);
    await queryRunner.query(`DROP TABLE "tenant_configs"`);
  }
}
