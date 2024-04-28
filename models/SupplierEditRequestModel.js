const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate-v2");

const supplierEditSchema = new Schema({
  isProfileStep: {
    type: Number,
    enum: [0, 1, 2, 3],
    default: 0,
  },
  supplierId: {
    type: ObjectId,
    ref: "Supplier",
  },
  basicInfo: {
    founderName: { type: String, default: "" },
    coFounderNames: { type: Array, default: [] },
    companyName: { type: String, default: "" },
    companyRegistrationYear: { type: Date, default: new Date() },
    companyRegistrationFile: { type: Array, default: [] },
    emailId: { type: String, default: "" },
    password: { type: String, default: "" },
    contactNo: { type: String, default: "" },
    countryCode: { type: String, default: "" },
    dob: { type: String, default: "" },
    country: { type: String, default: "" },
    website: { type: String, default: "" },
    spocName: { type: String, default: "" },
    spocEmail: { type: String, default: "" },
    spocNumber: { type: String, default: "" },
  },
  address: {
    address: { type: String, default: "" },
    localTown: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pinCode: { type: String, default: "" },
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
  kycDetails: {
    gstDeclaration: { type: Array, default: [] },
    gstDeclarationData: { type: String, default: "" },
    gstNoData: { type: String, default: "" },
    tanNumber: { type: String, default: "" },
    gstNo: { type: Array, default: [] },
    panNo: { type: Array, default: [] },
    panNoData: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    altNumber: { type: String, default: "" },
    idProofData: { type: String, default: "" },
    idProof: { type: Array, default: [] },
  },
  businessDetails: {
    businessLicenceNoData: { type: String, default: "" },
    businessLicenceNo: { type: Array, default: [] },
    selfAgreementData: { type: String, default: "" },
    bankDetailsData: { type: String, default: "" },
    bankDetails: { type: Array, default: [] },
    selfAgreement: { type: Array, default: [] },
    tradeLicenceFrom: { type: Date, default: new Date() },
    tradeLicenceTo: { type: Date, default: new Date() },
    tradeMarkFiles: { type: Array, default: [] },
    vendorEnroll: { type: Array, default: [] },
    businessDescription: { type: String, default: "" },
  },
  otherDetails: {
    proprietorName: { type: String, default: "" },
    landLine: { type: String, default: "" },
    accountPersonName: { type: String, default: "" },
    accountPersonNum: { type: String, default: "" },
    accountPersonEmail: { type: String, default: "" },
    contractNo: { type: String, default: "" },
    contractStatus: { type: String, default: "" },
    validContactStart: { type: Date, default: new Date() },
    validContactEnd: { type: Date, default: new Date() },
    bankName: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountNo: { type: String, default: "" },
    branchName: { type: String, default: "" },
    cancelledCheque: { type: Array, default: [] },
    payeeName: { type: String, default: "" },
    accountType: { type: String, default: "" },
    codeOfConduct: { type: Array, default: [] },
  },
  accountStatus: {
    type: String,
    default: "Active",
  },
  bankDetails: {
    accountHolderName: { type: String, default: "" },
    accountHolderPhoneNumber: { type: String, default: "" },
    accountholderEmailId: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    branchName: { type: String, default: "" },
    confirmAccountNumber: { type: String, default: "" },
    cancelledCheque: {
      type: Array,
      default: [],
    },
  },
  isEdited: {
    type: String,
    default: "editRequest", // Rejected by admin,Accepted by admin,Edit Request
  },
  role: {
    type: String,
    enum: ["supplier"],
    default: "supplier",
  },
  createdAt: { type: Date, default: new Date() },
  updatedAt: { type: Date, default: new Date() },
});

supplierEditSchema.plugin(mongoosePaginate);

const supplierEditRequestModel = mongoose.model(
  "SupplierEditRequest",
  supplierEditSchema,
  "SupplierEditRequest"
);

module.exports = supplierEditRequestModel;
