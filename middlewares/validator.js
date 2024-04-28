const Joi = require("joi");
const Helper = require("../config/helper");

const middleware = (schema, property) => {
  return (req, res, next) => {
    const _validationOptions = {
      abortEarly: false, // abort after the last validation error
      allowUnknown: true, // allow unknown keys that will be ignored
      stripUnknown: true, // remove unknown keys from the validated data
    };
    var validateSchema = Joi.object().keys(schema);

    const { error } = validateSchema.validate(
      req[property],
      _validationOptions
    );
    // const { error1 } = validateSchema.validate(req[property]);
    const valid = error == null;
    if (valid) {
      next();
    } else {
      //console.log(error);
      const { details } = error;
      //console.log(JSON.stringify(details))
      const message = details.map((i) => i.message).join(",");
      //console.log("error", message);
      //var result = { errors: validate.error.details };
      var result = { errors: message };
      return Helper.response(res, 422, "Parameter missing.", result);
    }
  };
};

module.exports = middleware;
