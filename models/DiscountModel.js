const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require('mongoose-paginate');

const DiscountSchema = new Schema({
    amount: {
        type: Number,
        default: 0
    },
    currencyCode: {
        type: String,
        default: "$"
    },
    status: {
        type: String,
        enum: ['Inactive', 'Active', 'Delete'],
        default: 'Inactive'
    },
    }, {
        timestamps: true
    });
DiscountSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Discount', DiscountSchema, 'Discount');