const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
  telegramId: {
    type: String,
    required: true
  },
  Way: {
    type: String,
    required: true,
    default:" "
  },
  Active: {
    type: Boolean,
    required: true,
    default:false
  },
  Balance: {
    type: Number,
    default:0.0
  },
  Name: {
    type: String,
    required: true
  },
  TempData: {
    type: String,
  },
})

mongoose.model('User',User)