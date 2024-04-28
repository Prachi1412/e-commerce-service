const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const mongoosePaginate = require("mongoose-paginate-v2");
const ObjectId = Schema.Types.ObjectId;

const CustomerSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    emailId: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    registerType: {
      type: String,
      enum: ["Individual", "Institution"],
      default: "Individual",
    },
    jwtToken: [],
    contactNo: {
      type: String,
      default: " ",
    },
    //individual
    professionId: {
      type: ObjectId,
      ref: "Professions",
    },
    //Institution
    institutionId: {
      type: ObjectId,
      ref: "Institutions",
    },
    //individual
    professionalQualification: {
      type: String,
      default: "",
    },
    //individual
    yearsOfPractice: {
      type: Number,
      default: "",
    },
    //Institution
    yearOfEstablishment: {
      type: String,
      default: "",
    },
    //Institution
    nameOfFounder: {
      type: String,
      default: "",
    },
    other: {
      // text for other specify data
      type: String,
      default: "",
    },
    // Institution
    SPOCDetails: {
      name: {
        type: String,
        default: "",
      },
      emailId: {
        type: String,
        default: "",
      },
      spocAlternetEmail: {
        type: String,
        default: "",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
    },
    // Institution
    typeOfAccount: {
      type: String,
      enum: ["Free", "Premium"],
      default: "Free",
    },
    // Institution
    accountUpgradeStatus: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    // Institution
    productCategoryId: [
      {
        type: ObjectId,
        ref: "ProductCategory",
      },
    ],
    // Institution
    productSubCategoryId: [
      {
        type: ObjectId,
        ref: "ProductSubCategory",
      },
    ],
    // Institution
    typeOfHospital: {
      type: String,
      // enum: ["Multi Speciality", "Super Speciality", "Others"],
      default: "",
    },
    plans: {
      type: String,
      default: "",
    },
    // Institution
    typeOfHospitalValue: {
      type: String,
      default: "",
    },
    alternateEmailId: {
      type: String,
      default: "",
    },
    // Institution
    noOfBeds: {
      type: String,
      default: "",
    },
    jwtToken: [],
    // not used
    planDetails: {
      planType: {
        type: String,
        default: "",
      },
      charges: {
        type: String,
        default: "",
      },
      description: {
        type: String,
        default: "",
      },
    },
    cardDetails: {
      cardNumber: {
        type: String,
        default: "",
      },
      nameOfCard: {
        type: String,
        default: "",
      },
      expirationDate: {
        type: String,
        default: "",
      },
      cardSecurityCode: {
        type: String,
        default: "",
      },
    },
    dob: {
      type: String,
      default: "",
    },
    //both
    address: {
      type: String,
      default: "",
    },
    //both
    city: {
      type: String,
      default: "",
    },
    //both
    state: {
      type: String,
      default: "",
    },
    //both
    zipCode: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    countryCode: {
      type: String,
      default: "",
    },
    customerUniqId: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: " ",
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
    status: {
      type: String,
      enum: ["Active", "Inactive", "Delete"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);
CustomerSchema.plugin(aggregatePaginate);
CustomerSchema.plugin(mongoosePaginate);
const customerModel = mongoose.model("Customer", CustomerSchema, "Customer");

module.exports = customerModel;
