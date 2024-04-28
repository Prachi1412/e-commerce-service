const {
    validationResult
} = require('express-validator');

function validationErrorChecker(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'validation errors!',
            errors: errors.array()
        });
    }
    next();
}


module.exports = {
    validationErrorChecker,
};