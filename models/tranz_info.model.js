const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tranz_info = new Schema({
  telegramId: {
    type: String,
    required: true
  },
  id: {
    type: String,
  },
  Url: {
    type: String,
  },
  InvoiceId: {
    type: String,
  },
  Active: {
    type: Boolean,
    default: true,
    required: true,
  },
  Name: {
    type: String,
    required: true
  },
  Amount: {
    type: Number,
  },
})

mongoose.model('Tranz_info',Tranz_info)
