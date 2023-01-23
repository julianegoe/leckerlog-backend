const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const db = require('./database');

let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

// Authenticate User
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, (email, password, callback) => {
    db.findUserByEmail(email).then((user) => {
        if (!user.rows[0]) {
            return callback(null, false, 'Incorrect username and/or password.');
        }
        if (user.rows[0]) {
            if (!user.rows[0].is_verified) {
                return callback(
                    null,
                    false,
                    'Diese Email ist noch nicht verifiziert. Schaue in deinem Email-Postfach nach.')
            }
            bcrypt.compare(password, user.rows[0].password).then((result) => {
                if (!result) {
                    return callback(null, false, 'incorrect password');
                }
                if (result) {
                    return callback(null, user.rows[0])
                }
            }).catch(error => callback(error, false, { message: ':(((' }));
        };
    }).catch(error => callback(error, false, { message: ':(' }));
}));

// Authorize User
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, (jwtPayload, callback) => {
    db.findUserById(jwtPayload.user_id)
        .then((user) => {
            return callback(null, user);
        })
        .catch((error) => {
            return callback(error)
        });
}))