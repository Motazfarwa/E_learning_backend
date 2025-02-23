const { userModel } = require('../Models/user.model');

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;
module.exports = (passport)=>{
    
passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
  const user = await userModel.findOne({_id: jwt_payload.id})
  if(!user){
    return done (err,false)
  }
  return done (null,user)
}));
}