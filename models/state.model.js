const mongoose = require('mongoose')
const Schema = mongoose.Schema

const State = new Schema({
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
})

mongoose.model('State',State)