const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const transactionSchema = new Schema({
    orderId: {
        type: String,
        required: true
    },
    trackingId: {
        type: String,
        required: true
    },
    orderStatus: {
        type: String,
        default: "Pending",
    },
    amount: { type: Number, default: 0 },
    currency: {
        type: String,
        default: "INR",
    },
    ccavResponse: {
        type: String,
        default: ""
    },
}, {
    timestamps: true
});
transactionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Transaction", transactionSchema, "Transaction");