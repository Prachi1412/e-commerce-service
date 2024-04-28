const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const indiaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
});
const date = new Date(indiaTime);

const orderSchema = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
    },

    parentOrderId: {
        type: String,
        required: true,
        unique: true,
    },
    attachmentFiles: [{
        type: String,
        default: "",
    }, ],
    trackingId: {
        type: String,
        default: "",
    },
    invoiceNumber: { type: String, default: "" },
    totalPrice: {
        type: Number,
        default: 0,
    },
    productMrp: {
        type: Number,
        default: 0,
    },
    gstAmount: {
        type: Number,
        default: 0,
    },
    amountReceived: {
        type: Number,
        default: 0,
    },
    deliveryMode: {
        type: String,
        enum: ["Delivery", "Self pickup"],
        default: "Delivery",
    },
    discount: {
        type: String,
        default: "",
    },
    deliveryInstruction: {
        type: String,
        default: "",
    },
    // parentOrderId: { type: String, default: '' }, // 1843518046
    deliveryCharges: {
        type: String,
        default: "",
    },
    pickupDate: {
        type: Date,
        default: Date,
    },
    paymentMode: {
        type: String,
        enum: ["PREPAID", "COD"],
        default: "PREPAID",
    },
    paymentId: {
        type: String,
        default: "",
    },
    paymentGateway: {
        type: String,
        enum: ["ccavenue", "razorpay"],
        default: "ccavenue",
    },
    paymentStatus: {
        type: String,
        default: "Pending",
    },
    orderStatus: {
        type: String,
        default: "PENDING",
    },
    appliedPromo: {
        type: String,
        default: "",
    },
    promoDiscountAmount: {
        type: String,
        default: "",
    },
    deliveryDate: {
        type: Date,
        default: Date.now,
    },
    invoiceS3Key: {
        type: String,
        default: "",
    },
    invoicePDFName: {
        type: String,
        default: "",
    },
    invoiceDate: {
        type: Date,
    },
    orderStatusDate: {
        type: Date,
        default: Date.now,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isReadSeller: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});
orderSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Order", orderSchema, "Order");