const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const validationSchema = {
  admin: {
    firstName: Joi.string().trim().min(3).max(30).required(),
    // lastName: Joi.string().trim().min(3).max(30).required(),
    email: Joi.string().trim().email().required(),
    // password: Joi.string().min(3).max(30).required(),
    role: Joi.string().required(),
  },
  adminStatus: {
    status: Joi.string().required(),
  },
  serviceabilityShipCharge: Joi.array().items({
    pickup_postcode: Joi.string()
      .pattern(new RegExp(/^\d{6}$/))
      .required(),
    delivery_postcode: Joi.string()
      .pattern(new RegExp(/^\d{6}$/))
      .required(),
    weight: Joi.number().positive().required(),
    cod: Joi.number().integer().min(0).required(),
  }),
};

module.exports = validationSchema;
