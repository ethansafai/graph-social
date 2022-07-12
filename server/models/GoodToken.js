const mongoose = require("mongoose");
const { TOKEN_EXPIRATION_SECONDS } = require("../constants/authConstants");

const goodTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: TOKEN_EXPIRATION_SECONDS,
  },
});

goodTokenSchema.index({ token: 1 });

module.exports = mongoose.model("GoodToken", goodTokenSchema);
