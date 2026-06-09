const mongoose = require('mongoose')
const Schema = mongoose.Schema

const objSchema = new Schema({
    id: Schema.Types.ObjectId,
    text: Schema.Types.String,
})

const Obj = mongoose.model('Obj', objSchema)
module.exports = Obj