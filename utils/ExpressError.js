class ExpressError extends Error {
    constructor(status = 500, message = "Something Went Wrong!", details = null) {
        super(message);
        this.status = status;
        this.statusCode = status;
        this.message = message;
        this.details = details;
    }
}

module.exports = ExpressError;