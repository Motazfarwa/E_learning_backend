const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../Models/user.model');  // Adjust the path to your user model
const secretOrKey = process.env.JWT_SECRET || '12345';  // Use the secret from .env

module.exports = function(passport) {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = secretOrKey;  // Pass the secret to JwtStrategy

  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findById(jwt_payload.id)
      .then(user => {
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
      .catch(err => done(err, false));
  }));
};
