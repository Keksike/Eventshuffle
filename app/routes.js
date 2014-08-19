// app/routes.js
module.exports = function(app, passport) {

	/*Home page*/
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	/*Login page*/
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') }); 
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
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
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

