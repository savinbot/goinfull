const mongoose = require('mongoose')
const Schema = mongoose.Schema

const City = new Schema({
  id: {
    type: String,
  },
  Name: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    required: true
  },
  State: {
    type: String,
    required: true
  },
})

mongoose.model('City',City)