function NotFound(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 404;
    }

    this.message = message;
    this.name = 'NotFound';
}

function NotAllowed(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 405;
    }

    this.message = message;
    this.name = 'NotAllowed';
}

function InvalidData(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 400;
    }

    this.message = message || 'Invalid Data';
    this.name = 'InvalidData';
}

function InternalServerError(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 500;
    }

    this.message = message || 'Internal Server Error';
    this.name = 'Internal Server Error';
}

function UnauthorizedAccess(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 401;
    }

    this.message = message || 'Unauthorized Access';
    this.name = 'Unauthorized Access';
}

function JwtExpired(message, code) {
    if (code) {
        this.code = code;
    } else {
        this.code = 463;
    }

    this.message = message || 'Jwt Expired or invalid';
    this.name = 'Jwt Expired';
}

function ErrorFilter(e) {
    return e.response.data.error.message;
}

function ExpErrorHandler(error) {
    this.code = error.code || 400;
    this.message = error.message || 'Something Went wrong!';
    this.name = error.name || 'Bad Request';
}

NotFound.prototype = Error.prototype;
NotAllowed.prototype = Error.prototype;
InvalidData.prototype = Error.prototype;
InternalServerError.prototype = Error.prototype;
UnauthorizedAccess.prototype = Error.prototype;
ErrorFilter.prototype = Error.prototype;
JwtExpired.prototype = Error.prototype;
ExpErrorHandler.prototype = Error.prototype;

module.exports.NotFound = NotFound;
module.exports.NotAllowed = NotAllowed;
module.exports.InvalidData = InvalidData;
module.exports.InternalServerError = InternalServerError;
module.exports.UnauthorizedAccess = UnauthorizedAccess;
module.exports.ErrorFilter = ErrorFilter;
module.exports.JwtExpired = JwtExpired;
module.exports.ExpErrorHandler = ExpErrorHandler;