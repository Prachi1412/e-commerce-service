const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require('mongoose-paginate');

const AddressSchema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    street: {
      type: String,
      default: "",
    },
    landMark: {
      type: String,
      default: "",
    },
    pinCode: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    orderPosition: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Inactive", "Active", "Delete"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);
AddressSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Address', AddressSchema, 'Address');