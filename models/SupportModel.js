const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const SupportSchema = new Schema(
  {
    addedBy: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    productId: {
      type: String,
      default: "",
    },
    attachedFiles: [
      {
        imgName: { type: String, default: "" },
      },
    ],
    supportType: {
      type: String,
      default: "",
    },
    categoryType: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    dateOfResoluton: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
SupportSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Support", SupportSchema, "Support");
