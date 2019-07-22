const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Product = new Schema({
  telegramId: {
    type: String,
    default:'false'
  },
  id: {
    type: String,
  },
  Name: {
    type: String,
    required: true,
  },
  Description: {
    type: String,
    required: true
  },
  Type: {
    type: String,
    required: true
  },
  State: {
    type: String,
    required: true
  },
  City: {
    type: String,
    required: true
  },
})

mongoose.model('Product',Product)