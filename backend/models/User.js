const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  profileImage: { type: String },
});

module.exports = mongoose.model("User", userSchema);
