module.exports= {
 auth: {
     user : 'nestyafam@gmail.com',
     pass : '94045728cd',

 },

 facebook: {
     clientID: '559144641161561',
     clientSecret: '874a423bd723354301d44197434e4ab9',
     profileFields: ['email','display_Name'],
     callbackURL:'http://localhost:1234/auth/facebook/callback',
     passReqToCallback: true
 }
};