const TOKEN_EXPIRATION_MINUTES = "15m";
const TOKEN_EXPIRATION_SECONDS =
  parseInt(
    TOKEN_EXPIRATION_MINUTES.substring(0, TOKEN_EXPIRATION_MINUTES.length - 1)
  ) * 60;
const TOKEN_EXPIRATION_MILLISECONDS = TOKEN_EXPIRATION_SECONDS * 1000;

module.exports = {
  TOKEN_EXPIRATION_MINUTES,
  TOKEN_EXPIRATION_MILLISECONDS,
};
