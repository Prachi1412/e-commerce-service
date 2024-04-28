const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const serviceSchema = new Schema(
  {
    productCategoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductCategory",
      },
    ],
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    productSubCategoryId: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProductSubCategory",
      },
    ],
    serviceName: {
      type: String,
      //   required: true,
      //   index: true,
    },
    serviceDescription: {
      type: String,
      default: "",
    },
    timeToInitiateService: {
      type: Number,
      default: 0,
    },
    durationOfService: {
      type: Number,
      default: 0,
    },
    companyProfileImage: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    price: {
      type: Number,
      default: 0
    },
    serviceImage: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    serviceImageThumbnail: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Delete", "Cancel"],
      default: "Inactive",
    },
    typeOfService: {
      type: Array, //One-time/ Recurring / Both
      default: [],
    },
    customizationAvailable: {
      type: String, //yes,no
      default: "",
    },
    preRequisiteOffering: {
      type: String,
      default: "",
    },
    relevantCertifications: [
      {
        certificateName: {
          type: String,
          default: "",
        },
        dateOfIssue: {
          type: Date,
          default: new Date(),
        },
        validityTill: {
          type: Date,
          default: new Date(),
        },
        uploadCertificate: [
          {
            imgName: {
              type: String,
              default: "",
            },
          },
        ],
      },
    ],
    awardRecognition: {
      type: String,
      default: "",
    },
    otherInformation: {
      type: String,
      default: "",
    },
    categoryType: {
      type: String,
      default: "Service",
    },
    keywords: {
      type: String,
      default: "",
    },
    serviceUniqId: {
      type: String,
      required: true,
      unique: true,
    },
    submitStatus: {
      isSubmitted: {
        type: Boolean,
        default: true,
      },
      submitttedDate: {
        type: Date,
        default: new Date(),
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEdit: {
      type: String,
      default: "", // admin or supplier
    },
  },
  {
    timestamps: true,
  }
);
serviceSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Service", serviceSchema, "Service");
