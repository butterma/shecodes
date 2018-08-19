const debug = require('debug')("shecodes:user");
const mongo = require('mongoose');
var Enum =require('enum');
var bcrypt=require('bcrypt-nodejs');
const Schema = mongo.Schema;

    var schema = new Schema({ 
        username: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        role: {type: String,enum:['Admin','Area manager','Branch manager','Course coordinator']},
        course: {type:String,enum:['python','web','android','data analysis']},
        branch: {type:String, enum:['TAU','BGU','HUJI','google','cisco','IBM','wix','technion']},
        approved:Boolean,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        image: String
    });

    schema.pre('save', function(next) {
        var user = this;
        var SALT_FACTOR = 5;
      
        if (!user.isModified('password')) return next();
       console.log("update password");
        bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
          if (err) return next(err);
      
          bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
          });
        });
      });
      
   
         // generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password) {
    debug(password);
    var result = bcrypt.compareSync(password, this.password);
    debug("check password validation");
    return result;
};
// CRUD without the U
schema.statics.CREATE = async function (str) {
        return this.find({username: str}).exec();
    }; 


schema.statics.REQUEST = async function(cb) {
        let cursor;
        let asynch = cb.constructor.name === 'AsyncFunction';
        try {
            cursor = await this.find().cursor();
        } catch (err) { throw err; }
        try {
            while (user = await cursor.next())
                if (asynch)
                    try { await cb(user); } catch (err) { throw err; }
                else
                    cb(user);
        } catch (err) { throw err; }
    };

    schema.statics.DELETE = async function(id) {
        return this.findByIdAndRemove(id).exec();
    };

   // db.model('User', schema );
    debug("User model created");
//};
module.exports=mongo.model('User',schema);




