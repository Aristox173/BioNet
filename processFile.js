import fs from "fs-extra";
import path from "path";
import csv from "csv-parser";
import { sql, poolPromise } from "./db.js";

const isValidCsv = async (filePath) => {
  const lines = await fs.readFile(filePath, "utf8");
  return lines.trim().split("\n").length > 1;
};

const processCsvFile = async (filePath) => {
  if (!(await isValidCsv(filePath))) {
    console.log(`Archivo inválido: ${path.basename(filePath)}`);
    await fs.move(filePath, path.join("error", path.basename(filePath)), {
      overwrite: true,
    });
    return;
  }

  console.log(`Procesando archivo: ${path.basename(filePath)}`);

  const rows = [];
  const pool = await poolPromise;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      for (const row of rows) {
        const { paciente_id, tipo_examen, fecha_examen } = row;

        const checkQuery = `
          SELECT 1 FROM resultados_examenes 
          WHERE paciente_id = @paciente_id AND tipo_examen = @tipo_examen AND fecha_examen = @fecha_examen
        `;

        const result = await pool
          .request()
          .input("paciente_id", sql.VarChar, paciente_id)
          .input("tipo_examen", sql.VarChar, tipo_examen)
          .input("fecha_examen", sql.Date, fecha_examen)
          .query(checkQuery);

        if (result.recordset.length === 0) {
          const insertQuery = `
            INSERT INTO resultados_examenes (laboratorio_id, paciente_id, tipo_examen, resultado, fecha_examen)
            VALUES (@laboratorio_id, @paciente_id, @tipo_examen, @resultado, @fecha_examen)
          `;
          await pool
            .request()
            .input("laboratorio_id", sql.VarChar, row.laboratorio_id)
            .input("paciente_id", sql.VarChar, paciente_id)
            .input("tipo_examen", sql.VarChar, tipo_examen)
            .input("resultado", sql.VarChar, row.resultado)
            .input("fecha_examen", sql.Date, fecha_examen)
            .query(insertQuery);

          console.log(`Insertado: ${paciente_id} - ${tipo_examen}`);
        } else {
          console.log(`Duplicado ignorado: ${paciente_id} - ${tipo_examen}`);
        }
      }

      await fs.move(filePath, path.join("processed", path.basename(filePath)), {
        overwrite: true,
      });
    });
};

export default processCsvFile;
