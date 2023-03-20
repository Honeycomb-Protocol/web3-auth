import type { SqliteDriver } from "@mikro-orm/sqlite"; // or any other driver package
import { MikroORM } from "@mikro-orm/core";

export const connectDB = async (dbName: string) => {
  const orm = await MikroORM.init<SqliteDriver>({
    entities: ["./dist/models"], // path to our JS entities (dist), relative to `baseDir`
    entitiesTs: ["./src/models"], // path to our TS entities (src), relative to `baseDir`
    dbName: `${dbName}.sqlite`,
    type: "sqlite",
    allowGlobalContext: true,
  });

  await orm.getMigrator().up();
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();
  await orm.getMigrator().down();

  return orm;
};
