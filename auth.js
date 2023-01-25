require('dotenv').config();
const { body, validationResult } = require('express-validator');
const jwtSecret = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.email,
        expiresIn: '3d',
        algorithm: 'HS256'
    });
};

module.exports = (router) => {
    router.post('/login',
        body('email').isEmail()
            .withMessage('Das ist keine valide E-mail.'),
        body('password').isLength({ min: 5 })
            .withMessage('Dein Passwort muss mindestens 5 Zeichen haben.'),
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            passport.authenticate('local', { session: false }, (error, user, info) => {
                if (error || !user) {
                    return res.status(401).json({
                        error,
                        info,
                        user: user
                    });
                };
                req.login(user, { session: false }, (error) => {
                    const token = generateJWTToken(user);
                    return res.status(200).json({ user, token, message: 'Login erfolgreich.' });
                });
            })(req, res);
        });
};

