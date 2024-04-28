const { check } = require("express-validator");

const register = [
  check("founderName")
    .exists()
    .withMessage("Field Missing.")
    .isLength({
      min: 1,
    })
    .withMessage("Min length of name required-1"),

  check("emailId")
    .exists()
    .withMessage("Field Missing.")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .isLength({
      min: 1,
    })
    .withMessage("Min length of email required-1"),

  check("password")
    .trim()
    .exists()
    .withMessage("Field Missing.")
    .isLength({
      min: 1,
    })
    .withMessage("Min length required-1"),
];

const login = [
  check("emailId")
    .exists()
    .withMessage("Field Missing.")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .isLength({
      min: 1,
    })
    .withMessage("Min length of email required-1"),

  check("password")
    .trim()
    .exists()
    .withMessage("Field Missing.")
    .isLength({
      min: 1,
    })
    .withMessage("Min length required-1"),
];

const updateSupplierAccountStatus = [
  check("status")
    .exists()
    .isIn(["Pending", "Active", "Inactive", "Delete"])
    .withMessage("Please enter a valid Status option"),
];

module.exports = {
  register,
  login,
  updateSupplierAccountStatus,
  // signup,
  // checkEmailExist,
  // signin,
  // forgot,
  // fisrtPasswordSet,
  //refreshToken
};
