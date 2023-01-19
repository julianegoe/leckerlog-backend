require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
      subject: user.email,
      expiresIn: '7d',
      algorithm: 'HS256'
    });
  };

module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'something is not right',
                    error: error,
                    info: info,
                    user: user
                });
            };
            req.login(user, { session: false }, (error) => {
                const token = generateJWTToken(user);
                console.log(token)
                return res.status(200).json({ user, token });
            });
        })(req, res);
    });
};

