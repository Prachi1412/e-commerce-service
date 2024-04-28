const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");

const FaqsSchema = new Schema(
  {
    faqArr: [
      {
        question: {
          type: String,
          default: "",
        },
        answer: {
          type: String,
          default: "",
        },
      },
    ],
    status: {
      type: String,
      enum: ["Inactive", "Active", "Delete"],
      default: "Active",
    },
    category: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    orderPosition: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: "", //for diff seller
    },
  },
  {
    timestamps: true,
  }
);
FaqsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Faqs", FaqsSchema, "Faqs");
