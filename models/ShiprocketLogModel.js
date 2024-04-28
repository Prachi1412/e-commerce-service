const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
var ObjectId = mongoose.Schema.Types.ObjectId;
mongoose.set('debug', false);
const ShiprocketLogSchema = new mongoose.Schema({
    payload: {
        type: Object,
        default: {}
    },
    payloadType: {
        type: String,
        enum: ['WEBHOOK', 'CRONJOB', 'CREATE-ORDER', 'ERROR', 'ADMIN'],
        default: "WEBHOOK"
    }
}, {
    timestamps: true
})
ShiprocketLogSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("ShiprocketLogs", ShiprocketLogSchema, 'ShiprocketLogs');