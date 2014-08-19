// app/routes.js
module.exports = function(app, passport) {

	/*Home page*/
	app.get('/', function(req, res) {
		res.render('index.ejs', { message: req.flash('loginMessage') }); 
	});

	// process the login form
	// app.post('/login', do all our passport stuff here);

	/*Signup page*/
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	// app.post('/signup', do all our passport stuff here);

	/*Profile page*/
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	/*Logging out*/
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});


	/*Processing the signup*/
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to personal profile page
		failureRedirect : '/signup', // redirect back (stay) on the signup page
		failureFlash : true // allow flash messages
	}));

	/*Processing the login*/
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to personal profile page
		failureRedirect : '/', // redirect back (stay) to login page
		failureFlash : true
	}));
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

