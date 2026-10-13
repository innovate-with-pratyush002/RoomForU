const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
  name: { type: String, required: true },

  email: { type: String, unique: true, required: true },

  username: {
    type: String,
    unique: true,
    sparse: true
  },

  googleId: { type: String, unique: true, sparse: true },

  picture: String

},{ timestamps: true });

User.plugin(passportLocalMongoose, {
  usernameField: 'username',
  usernameLowerCase: true,
  limitAttempts: true,
  usernameUnique: false 
});


module.exports = mongoose.model('UserAuth', User);