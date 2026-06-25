import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductComponents1787000000000 implements MigrationInterface {
  name = 'AddProductComponents1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Campo matéria prima no produto
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_materia_prima" boolean NOT NULL DEFAULT false`,
    );

    // Tabela de composição (ficha técnica)
    await queryRunner.query(`
      CREATE TABLE "product_components" (
        "id"          uuid             NOT NULL DEFAULT uuid_generate_v4(),
        "created_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "product_id"  uuid             NOT NULL,
        "material_id" uuid             NOT NULL,
        "quantidade"  numeric(10,3)    NOT NULL,
        "unidade"     character varying(10) NOT NULL,
        CONSTRAINT "PK_product_components" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "product_components" ADD CONSTRAINT "FK_pc_product"
       FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_components" ADD CONSTRAINT "FK_pc_material"
       FOREIGN KEY ("material_id") REFERENCES "products"("id") ON DELETE RESTRICT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_components" DROP CONSTRAINT "FK_pc_material"`);
    await queryRunner.query(`ALTER TABLE "product_components" DROP CONSTRAINT "FK_pc_product"`);
    await queryRunner.query(`DROP TABLE "product_components"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "is_materia_prima"`);
  }
}
