const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Type = new Schema({
  id: {
    type: String,
  },
  Name: {
    type: String,
    required: true,
  },
  Sort: {
    type: String,
    required: true
  },
  Price: {
    type: Number,
    required: true
  },
})

mongoose.model('Type',Type)