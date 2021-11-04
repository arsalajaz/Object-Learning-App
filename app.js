const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const app = express();

//database connection ------------------------------------------------------------- //database Schemas

mongoose.connect("mongodb://localhost:27017/userData");

const ImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
})

const SetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    images: [ImageSchema]
})

const UserSchema = new mongoose.Schema({ //
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    assignedSets: [SetSchema]
});

const User = mongoose.model('User', UserSchema);
const Image = mongoose.model('Image', ImageSchema);
const Set = mongoose.model('Set', SetSchema)

//-------------------------------------------------------------------------------------------------------------------------//


//Middleware -------------------------------------------------------------------------------------------------------------//

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: "@)J}rut-?7C}KRge8",
    resave: "false",
    saveUninitialized: true
}))
app.use(express.urlencoded({extended: true}));

//Passport.js ------------------------------------------------------------------------------------------------------------//

app.use(passport.initialize())
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done){
    User.findById(id, function (err, user) {
        done(err, user)
    });
});

passport.use(new localStrategy(function(username, password, done){
    User.findOne({username: username}, function(err, user){
        if(err) {return done(err);}
        if(!user) {
            return done(null, false, {message: 'Incorrect username.'})
        }
        bcrypt.compare(password, user.password, function(error, res){
            if(error){
                return done(error)
            }
            if(res === false) {
                return done(null, false, {message: 'Incorrect Password'});
            }
            return done(null, user);
        })
    })
}));

//fucntions check if the user is logged in --------------------------------------------------------------------------------//

function isLoggedIn(req, res, next) { //checks if logged in
    if(req.isAuthenticated()) return next();
    res.redirect('/login')
}
function isLoggedOut(req, res, next) { //checks if logged out
    if(!req.isAuthenticated()) return next();
    res.redirect('/')
}
function isLoggedInAdmin(req, res, next) { //checks if admin is logged in
    if(req.isAuthenticated() && req.user.role == 'admin') {
        return next();
    }
    res.redirect('/login?error=Permission Denied. Only an Admin can make this request')
}

//Other functions-------------------------------------------------------------------------------------------------------------------------//

function createNewSet(name, images) {
    let newSet = new Set({
        name: name,
        images: images
    })
    newSet.save();
}

//Routes---------------------------------------------------------------------------------------------------------------------------//

app.get('/', isLoggedIn , async function(req, res) {
    
    if(req.user.role == 'instructor') res.redirect('/dashboard');
    else if(req.user.role == 'student') res.redirect('/portal');
    else {
        res.render('homeAdmin', {
            title: "Home",
            role: req.user.role,
            returnmsg: req.query.msg
        })
    }
});

app.get('/login', isLoggedOut, function(req, res){
    res.render('login', {
        title: "Login",
        errorMsg: req.query.error
    });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?error=Incorrect Username/Password'
}));

//logout route
app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect('/');
})

//--admin sets a new user ------------------------////
app.post('/setup', isLoggedInAdmin, async function(req, res) {
	const exists = await User.exists({ username: req.body.username});

	if (exists) {
		res.redirect('/?msg=User Already Exists');
		return;
	}

	bcrypt.genSalt(10, function (err, salt) {
		if (err) return next(err);
		bcrypt.hash(req.body.password, salt, function (error, hash) {
			if (error) return next(error);
			
			const newUser = new User({
				username: req.body.username,
				password: hash,
                role: req.body.role
			});

			newUser.save();

			res.redirect('/?msg=Success');
		});
	});
});

app.get("/dashboard", isLoggedIn, function(req, res){
    if(req.user.role != 'instructor') res.redirect('/');
    else {
        Image.find({}, function(err, arr) {
            if(err) console.log(err);
            res.render('homeInstructor',{
                images: arr,
                msg: req.query.msg,
                setMsg: req.query.setMsg
            });
        });
    } 
});

app.get("/portal", isLoggedIn, function(req, res){
    if(req.user.role != 'student') res.redirect('/');
    else {
        res.render('homeStudent', {});
    }
});

app.post("/dashboard/add", isLoggedIn, function(req, res){
    const newImage = new Image({
        name: req.body.imageName,
        url: req.body.imageUrl
    });

    newImage.save();
    res.redirect('/dashboard?msg=Successfully Uploaded')
})

app.post("/dashboard/create", isLoggedIn, function(req, res){                                       //recieves post requests to create new sets
    
    if(req.body.setImages == null) {                                                                //if no image ids are sent then error
        res.redirect('/dashboard?setMsg=Need to select at least one image to create a new set')
    } else if(typeof req.body.setImages == 'string') {                                              //if only one image id is sent, create a set with only one image
        Image.findById(req.body.setImages, function(err, result){ 
            createNewSet(req.body.setName, [result]);
        })
        res.redirect('/dashboard?setMsg=Successfully Created')
    } else {
        let newSet = new Set({
            name: req.body.setName,
            images: []
        })
        
        let imageIDs = req.body.setImages;
        
        for (let i=0; i<imageIDs.length; i++) {                                                      //loop through imageid array to find all the images and push to set
            Image.findById(imageIDs[i], function(err, result){ 
                newSet.images.push(result);
                if(i == imageIDs.length - 1) {
                    newSet.save();
                }
            });
        }
        res.redirect('/dashboard?setMsg=Successfully Created')
    }
    
});

app.listen('3000', function (err) { //starts the server
    console.log("Server started on port 3000");
});



