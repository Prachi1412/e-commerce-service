const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const mongoosePaginate = require("mongoose-paginate-v2");

const supplierSchema = new Schema({
  isProfileStep: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0,
  },
  supplierUniqId: {
    type: String,
    required: true,
    unique: true,
  },
  basicInfo: {
    founderName: {
      type: String,
      default: "",
    },
    coFounderNames: {
      type: Array,
      default: [],
    },
    companyName: {
      type: String,
      default: "",
    },
    companyRegistrationYear: {
      type: Date,
      default: new Date(),
    },
    companyRegistrationFile: {
      type: Array,
      default: [],
    },
    emailId: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "",
    },
    contactNo: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    spocName: {
      type: String,
      default: "",
    },
    spocEmail: {
      type: String,
      default: "",
    },
    spocNumber: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
  },
  address: {
    address: {
      type: String,
      default: "",
    },
    localTown: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
  },
  registeredAddress: {
    address: {
      type: String,
      default: "",
    },
    localTown: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
  },
  isSameAddress: {
    type: Boolean,
    default: false,
  },
  bankDetails: {
    accountHolderName: { type: String, default: "" },
    accountHolderPhoneNumber: { type: String, default: "" },
    accountholderEmailId: { type: String, default: "" },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    branchName: { type: String, default: "" },
    confirmAccountNumber: { type: String, default: "" },
    cancelledCheque: {
      type: Array,
      default: [],
    },
  },
  kycDetails: {
    gstDeclaration: {
      type: Array,
      default: [],
    },
    gstDeclarationData: {
      type: String,
      default: "",
    },
    gstNoData: {
      type: String,
      default: "",
    },
    gstNo: {
      type: Array,
      default: [],
    },
    panNo: {
      type: Array,
      default: [],
    },
    panNoData: {
      type: String,
      default: "",
    },
    contactPerson: {
      type: String,
      default: "",
    },
    altNumber: {
      type: String,
      default: "",
    },
    idProofData: {
      type: String,
      default: "",
    },
    idProof: {
      type: Array,
      default: [],
    },
    tanNumber: { type: String, default: "" },
  },
  businessDetails: {
    businessLicenceNoData: {
      type: String,
      default: "",
    },
    businessLicenceNo: {
      type: Array,
      default: [],
    },
    selfAgreementData: {
      type: String,
      default: "",
    },
    bankDetailsData: {
      type: String,
      default: "",
    },
    bankDetails: {
      type: Array,
      default: [],
    },
    selfAgreement: {
      type: Array,
      default: [],
    },
    tradeLicenceFrom: {
      type: Date,
      default: new Date(),
    },
    tradeLicenceTo: {
      type: Date,
      default: new Date(),
    },
    tradeMarkFiles: {
      type: Array,
      default: [],
    },
    vendorEnroll: {
      type: Array,
      default: [],
    },
    businessDescription: {
      type: String,
      default: "",
    },
  },
  otherDetails: {
    proprietorName: {
      type: String,
      default: "",
    },
    landLine: {
      type: String,
      default: "",
    },
    accountPersonName: {
      type: String,
      default: "",
    },
    accountPersonNum: {
      type: String,
      default: "",
    },
    accountPersonEmail: {
      type: String,
      default: "",
    },
    contractNo: {
      type: String,
      default: "",
    },
    contractStatus: {
      type: String,
      default: "",
    },
    validContactStart: {
      type: Date,
      default: new Date(),
    },
    validContactEnd: {
      type: Date,
      default: new Date(),
    },
    bankName: {
      type: String,
      default: "",
    },
    ifscCode: {
      type: String,
      default: "",
    },
    accountNo: {
      type: String,
      default: "",
    },
    cancelledCheque: {
      type: Array,
      default: [],
    },
    branchName: {
      type: String,
      default: "",
    },
    payeeName: {
      type: String,
      default: "",
    },
    cancelledCheque: {
      type: Array,
      default: [],
    },
    accountType: {
      type: String,
      default: "",
    },
    codeOfConduct: {
      type: Array,
      default: [],
    },
  },
  otp: {
    type: String,
    default: "",
  }, // 6 digit otp
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
  otpExpiredToken: {
    type: String,
    default: "",
  },
  accountStatus: {
    type: String,
    enum: ["Active", "Inactive", "Delete"],
    default: "Active",
  },

  JWT_Token: [],

  role: {
    type: String,
    enum: ["supplier"],
    default: "supplier",
  },
  isEdited: {
    type: String,
    default: "pending", // Rejected by admin,Accepted by admin,Edit Request
  },
  // email verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: "",
  },
  verificationTokenExpires: {
    type: Date,
    default: new Date(),
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    default: new Date(),
  },
});

supplierSchema.plugin(mongoosePaginate);

const supplierModel = mongoose.model("Supplier", supplierSchema, "Supplier");

module.exports = supplierModel;