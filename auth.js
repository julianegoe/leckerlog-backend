require('dotenv').config();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const db = require('./database');
require('./passport');

const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            password: user.password,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { subject: user.email, expiresIn: "15m", algorithm: 'HS256', }
    );
    const refreshToken = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email,
            password: user.password,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { subject: user.email, expiresIn: "30d", algorithm: 'HS256', }
    );

    await db.updateRefreshToken(refreshToken, user.user_id);
    return { accessToken, refreshToken }
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
                req.login(user, { session: false }, async (error) => {
                    const { accessToken, refreshToken } = await generateTokens(user);
                    return res.status(200).json({ user, accessToken, refreshToken, message: 'Login erfolgreich.' });
                });
            })(req, res);
        });
};

