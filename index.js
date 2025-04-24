import fs from "fs";
import path from "path";
import processCsvFile from "./processFile.js";

const watchFolder = "input-labs";

fs.watch(watchFolder, async (eventType, filename) => {
  if (filename.endsWith(".csv") && eventType === "rename") {
    const fullPath = path.join(watchFolder, filename);
    if (fs.existsSync(fullPath)) {
      await processCsvFile(fullPath);
    }
  }
});

console.log("Esperando archivos CSV en la carpeta input-labs...");
