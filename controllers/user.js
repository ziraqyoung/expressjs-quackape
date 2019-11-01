const validator = require("validator");
const passport = require("passport");
const User = require("../models/User");
/**
 * GET /login (login page)
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/login", {
    title: "Login"
  });
};
/**
 * POST /login
 * Sign in with email and password
 */
exports.postLogin = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msh: "Please a valid email" });
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Pasword can't be blank" });
  if (validationErrors.lenght) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("errors", info);
      return res.redirect("/login");
    }
    req.logIn(user, err => {
      if (err) return next(err);
      req.flash("success", { msg: "Success. You are logged in." });
      res.redirect(req.session.returnTo || "/");
    });
  })(req, res, next);
};
/**
 * GET /signup
 *  Signup page
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/signup", { title: "Create Account" });
};
/**
 * POST /signup
 * Create a new local account
 */
exports.postSignup = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email" });
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be atleast 8 characters long"
    });
  if (req.body.password !== req.body.confirmPassword)
    validationErrors.push({ msg: "Password do not match" });

  if (validationErrors.lenght) {
    req.flash("errors", validationErrors);
    return res.redirect("/signup");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });
  const user = new User({
    email: req.body.email,
    password: req.body.password
  });
  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) return next(err);
    if (existingUser) {
      req.flash("errors", { msg: "Account with that email already exists" });
      return res.redirect("/signup");
    }
    user.save(err => {
      if (err) return next(err);
      req.logIn(user, err => {
        if (err) return next(err);
      });
      res.redirect("/");
    });
  });
};
/**
 * GET /logout
 * logsout user
 */
exports.logout = (req, res) => {
  req.logout();
  req.session.destroy(err => {
    if (err) console.log("Error: failed to destroy session during logout", err);
    req.user = null;
    res.redirect("/");
  });
};
/**
 * GET /account
 */
exports.getAccount = (req, res) => {
  res.render("account/profile", { title: "Account Management" });
};
/**
 * POST /account/profile
 * update profile information
 */
exports.postUpdateProfile = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  User.findById(req.user.id, (err, user) => {
    if (err) return next(err);
    user.email = req.body.email || "";
    user.profile.name = req.body.name || "";
    user.profile.gender = req.body.gender || "";
    user.profile.location = req.body.location || "";
    user.profile.website = req.body.website || "";
    user.save(err => {
      if (err) {
        if (err.code === 11000) {
          req.flash("errors", {
            msg:
              "The email address you have entered is already associated with an account"
          });
          return res.redirect("/account");
        }
        return next(err);
      }
      req.flash("success", {
        msg: "Account information has been updated successfully"
      });
      res.redirect("/account");
    });
  });
};
