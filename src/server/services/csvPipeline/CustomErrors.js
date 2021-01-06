class CSVPipelineError extends Error {
    constructor(responseMessage, logMessage=responseMessage) {
        super(responseMessage);
        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;
        this.data = { logMessage, responseMessage };
        // This clips the constructor invocation from the stack trace.
        // It's not absolutely essential, but it does make the stack trace a little nicer.
        //  @see Node.js reference (bottom)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    CSVPipelineError
};
