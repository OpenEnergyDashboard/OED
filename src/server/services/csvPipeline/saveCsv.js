const crypto = require('crypto');
const { CSVPipelineError } = require('./CustomErrors');
const streamBuffers = require('stream-buffers');
const zlib = require('zlib');

function streamToWriteBuffer(stream) {
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
        frequency: 10,
        chunkSize: 2048
    });
    writableStreamBuffer.write(stream);
    return writableStreamBuffer;
}

async function saveCsv(buffer, pronoun='meters') {
    const myWritableStreamBuffer = streamToWriteBuffer(buffer);
    // save this buffer into a file
    const randomFilename = `${pronoun}-${(new Date(Date.now()).toISOString())}-${crypto.randomBytes(16).toString('hex')}`;
    const filepath = `${__dirname}/${randomFilename}.csv`;
    await fs.writeFile(filepath, myWritableStreamBuffer.getContents())
        .catch(err => {
            const message = `Failed to write the file: ${filepath}`;
            throw CSVPipelineError(`Internal OED error: ${message}`, err.message);
        }); // separate logs function that logs for error message, 1. log it, 2. passback error codes to user, 3. stop process; 
    return filepath;
}

module.export = saveCsv;
