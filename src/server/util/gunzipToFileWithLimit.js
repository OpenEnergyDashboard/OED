const zlib = require("zlib");
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

/**
 * Stream gunzip -> file, while enforcing a hard cap on decompressed output bytes.
 * Prevents gzip "zip bombs" from exhausting memory/disk.
 *
 * @param {string} inputPath - Path to uploaded gzip file
 * @param {string} outputDir - Directory to write decompressed csv
 * @param {string} outputFilename - Filename to write
 * @param {number} maxBytes - Max allowed decompressed output size in bytes
 * @returns {Promise<string>} - Full path of decompressed csv file
 */
async function gunzipToFileWithLimit(inputPath, outputDir, outputFilename, maxBytes) {
  await fsp.mkdir(outputDir, { recursive: true });

  const outPath = path.join(outputDir, outputFilename);

  return new Promise((resolve, reject) => {
    const source = fs.createReadStream(inputPath);
    const gunzip = zlib.createGunzip();
    const dest = fs.createWriteStream(outPath, { flags: "wx" }); // fail if file exists

    let total = 0;

    gunzip.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        // Stop everything immediately
        const err = new Error(`Decompressed size exceeds limit (max ${maxBytes} bytes)`);
        source.destroy();
        dest.destroy();
        gunzip.destroy(err);
      }
    });

    const cleanup = async (err) => {
      try { await fsp.unlink(outPath); } catch (_) {}
      reject(err);
    };

    source.on("error", cleanup);
    gunzip.on("error", cleanup);
    dest.on("error", cleanup);

    dest.on("finish", () => resolve(outPath));

    source.pipe(gunzip).pipe(dest);
  });
}

module.exports = gunzipToFileWithLimit;
