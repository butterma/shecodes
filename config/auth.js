module.exports = {

    'facebookAuth' : {
        'clientID'        : 'your-secret-clientID-here', // your App ID
        'clientSecret'    : 'your-client-secret-here', // your App Secret
        'callbackURL'     : 'http://localhost:3000/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields'   : ['id', 'email', 'name'] // For requesting permissions from Facebook API

    },

    'googleAuth' : {
        'clientID'         : '49782137538-l0tbqhpf1tqgu4bq8kd967454ln0fmad.apps.googleusercontent.com',
        'clientSecret'     : 'cuugNzgoa0VxpZQmvTzEGGYT',
        'callbackURL'      : 'http://localhost:3000/users/auth/google/callback'
    }

};