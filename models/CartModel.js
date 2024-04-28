const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const cartSchema = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    productId: {
        type: ObjectId,
        ref: 'Products',
        required: true
    },
    quantity: { type: Number, default: "" },
    price: { type: Number, default: "" },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Delete'],
        default: "Active"
    },
}, {
    timestamps: true
});
cartSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("Cart", cartSchema, "Cart");