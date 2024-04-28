const mongoose = require("mongoose");
const { Schema } = mongoose;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const productSchema = new Schema(
  {
    supplierId: {
      type: Schema.ObjectId,
      ref: "Supplier",
    },
    productCategoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductCategory",
      },
    ],
    productName: {
      type: String,
      default: "",
    },
    productNameForListing: {
      type: String,
      default: "",
    },
    productSubCategoryId: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProductSubCategory",
      },
    ],
    productClassifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProductClassifcation",
      },
    ],

    productImages: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    productImageThumbnail: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    productCDSCORegistration: {
      type: String,
      default: "",
    },
    keywords: {
      type: String,
      default: "",
    },
    productCDSCORegistrationFiles: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    productDimensions: {
      width: {
        type: Number,
        default: 0,
      },
      height: {
        type: Number,
        default: 0,
      },
      length: {
        type: Number,
        default: 0,
      },
    },
    productDescription: {
      type: String,
      default: "",
    },
    sku: {
      type: String,
      default: "",
    },
    hsnNo: {
      type: String,
      default: "",
    },
    productPrice: {
      type: Number,
      default: 0,
    },
    priceByAdmin: {
      type: Number,
      default: 0,
    },
    productMinDelivery: {
      type: Number,
      default: 0,
    },
    productDeliveryPreference: {
      type: String,
      default: "",
    },
    productPaymentMode: {
      type: String, // "online,manual"
      default: "",
    },
    //if payment mode online
    partPayment: {
      // how many installment 1-6
      type: String,
      default: "",
    },
    installments: [
      {
        number: {
          type: Number,
        },
        percentage: {
          type: Number,
        },
      },
    ],
    isFullPayment: {
      type: Boolean,
      default: false,
    },
    isPartPayment: {
      type: Boolean,
      default: false,
    },
    shipmentType: {
      // ship rocket or manual
      type: String,
      default: "",
    },
    certificates: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    commisionAddedByAdmin: {
      // added by admin
      type: Number,
      default: 0,
    },
    categoryType: {
      type: String,
      default: "Product",
    },
    productCode: {
      type: String,
      default: "",
    },
    productWeight: {
      type: String,
      default: "",
    },
    productQuantity: {
      type: String,
      default: "0",
    },
    productUniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    contractFiles: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    productStatus: {
      type: String,
      default: "Inactive",
    },
    productTagline: {
      type: String,
      default: "",
    },
    genericName: {
      type: String,
      default: "",
    },
    specificUse: {
      type: String,
      default: "",
    },
    productVideo: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    uploadCertificateDetails: [
      {
        certificateName: {
          type: String,
          default: "",
        },
        dateOfIssue: {
          type: String,
          default: "",
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
    otherFeature: {
      type: String,
      default: "",
    },
    specification: {
      type: String,
      default: "",
    },
    compatibleDevices: {
      type: String,
      default: "",
    },
    typeOfconsumables: {
      type: String,
      default: "",
    },
    productInstallation: {
      type: String,
      default: "",
    },
    maintainainceOffer: {
      type: String,
      default: "",
    },
    accesoriesRequirement: {
      type: String,
      default: "",
    },
    maintenance: {
      type: String,
      default: "",
    },
    accessories: {
      type: String,
      default: "",
    },
    productWarrantyPeriod: {
      type: String,
      default: "",
    },
    consumables: {
      type: String,
      default: "",
    },
    productWarranty: {
      type: String,
      default: "",
    },
    consumableRequirement: {
      type: String,
      default: "",
    },
    otherRelevantInformation: {
      type: String,
      default: "",
    },
    uploadProductBrochure: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    typeOfDemo: {
      type: Array, // Virtual,physical,both
      default: [],
    },
    awardRecognition: {
      type: String,
      default: "",
    },
    shippingPreference: {
      type: String,
      default: "",
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    status: {
      // submit
      type: String,
      enum: [
        "Submitted",
        "Approved",
        "Cancel",
        "Contract Signed",
        "Customer List",
        "Delete",
      ], // submit by supplier,approved by admin,cancel by supplier,Delete both,contract sign by admin
      default: "Submitted",
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
    approvedStatus: {
      isApproved: {
        type: Boolean,
        default: false,
      },
      approvedDate: {
        type: Date,
        default: new Date(),
      },
    },
    cancelStatus: {
      isCancel: {
        type: Boolean,
        default: false,
      },
      cancelDate: {
        type: Date,
        default: new Date(),
      },
    },
    contractStatus: {
      isContract: {
        type: Boolean,
        default: false,
      },
      contractDate: {
        type: Date,
        default: new Date(),
      },
    },
    noOfUnitSold:{
        type: Number,
        default: 0,
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

productSchema.plugin(aggregatePaginate);

const productModel = mongoose.model("Product", productSchema, "Product");

module.exports = productModel;
