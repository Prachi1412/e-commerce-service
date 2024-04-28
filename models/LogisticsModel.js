const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require('mongoose-paginate');

const LogisticsSchema = new Schema({
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
        default: 'Active'
    },
    }, {
        timestamps: true
    });
LogisticsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Logistics', LogisticsSchema, 'Logistics');