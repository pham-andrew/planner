const mongoose = require('mongoose')
const Schema = mongoose.Schema

const activitySchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    // location stored as coordinates { lat, lng }
    location: {
        lat: { type: Number },
        lng: { type: Number },
    },
    duration: { type: String, default: '' },
    suggestedStart: { type: String },
    suggestedEnd: { type: String },
})

const eventSchema = new Schema({
    activity: { type: activitySchema, required: true },
    start: { type: String },
    end: { type: String },
})

const objSchema = new Schema({
    name: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, default: 'UTC' },
    secretId: { type: String, required: true, unique: true },
    viewSecret: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    activities: { type: [activitySchema], default: [] },
    events: { type: [eventSchema], default: [] },
})

const Obj = mongoose.model('Obj', objSchema)
module.exports = Obj