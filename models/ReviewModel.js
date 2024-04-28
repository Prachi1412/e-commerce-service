const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer", // Assuming you have a User model
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
      default: "",
    },
    images: [
      {
        imgName: {
          type: String,
          default: "",
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
reviewSchema.plugin(aggregatePaginate);
const Review = mongoose.model("Review", reviewSchema, "Review");

module.exports = Review;
