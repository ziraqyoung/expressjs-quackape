const { promisify } = require("util");
const crypto = require("crypto");
const validator = require("validator");
const passport = require("passport");
const nodemailer = require("nodemailer");

const randomBytesAsync = promisify(crypto.randomBytes);

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
  if (validationErrors.length) {
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

  if (validationErrors.length) {
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
/**
 * POST /account/password
 */
exports.postUpdatePassword = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long"
    });
  if (req.body.password !== req.body.confirmPassword)
    validationErrors.push({ msg: "Passwords do not match" });
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }
  User.findById(req.user.id, (err, user) => {
    if (err) return next(err);
    user.password = req.body.password;
    user.save(err => {
      if (err) return next(err);
      req.flash("success", { msg: "Password changed successfully" });
      res.redirect("/account");
    });
  });
};
/**
 * POST /account/delete
 * Delete a user account
 */
exports.postDeleteAccount = (req, res, next) => {
  User.deleteOne({ _id: req.user.id }, err => {
    if (err) return next(err);
    req.logout();
    req.flash("info", { msg: "Your account has been deleted" });
    res.redirect("/");
  });
};
/**
 * GET /forgot
 * Forgot password page
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("account/forgot", { title: "Forgot Password" });
};
/**
 * POST /forgot
 * Create a random string and send a link with token for password reset
 */
exports.postForgot = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address" });
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/forgot");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false
  });

  const createRandomBytes = randomBytesAsync(16).then(buf =>
    buf.toString("hex")
  );

  const setRandomToken = token =>
    User.findOne({ email: req.body.email }).then(user => {
      if (!user) {
        req.flash("errors", { msg: "Account with that email doesnot exist" });
      } else {
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hr
        user = user.save();
      }
      return user;
    });

  const sendForgotPasswordEmail = user => {
    if (!user) {
      return;
    }
    const token = user.passwordResetToken;

    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });

    const mailOptions = {
      from: "quakeape@app.com",
      to: user.email,
      subject: "Reset your password on QuakeApe",
      text: `You are receiving this email because you (or someone else) has requested the reset of the password of your account on QuakeApe \n\n
      Please click on the link below or paste in the browser to complete the process: \n\n
      http://${req.headers.host}/reset/${token} \n\n
      If you did not request this, please ignore this email and your password will remain unchanged.
      `
    };

    return transporter
      .sendMail(mailOptions)
      .then(() => {
        req.flash("info", {
          msg: `An e-mail has been sent to ${user.email} with further instructions.`
        });
      })
      .catch(err => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: self signed certificate in the certificate chain. Retrying with self signed certificate. Use a valid certificate in productions"
          );
          transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.SENDGRID_USER,
              pass: process.env.SENDGRID_PASSWORD
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          transporter.sendMail(mailOptions).then(() => {
            req.flash("info", {
              msg: `An e-mail has been sent to ${user.email} with further instructions`
            });
          });
        }
        console.log(
          "ERROR: Could not send forgot password email after security downgrade.\n",
          err
        );
        req.flash("errors", {
          msg:
            "Error sending the password reset message. Please try again shortly."
        });
        return err;
      });
  };

  createRandomBytes
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect("/forgot"))
    .catch(next);
};
/**
 * GET /reset/:token
 * Reset password page
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  User.findOne({ passwordResetToken: req.params.token })
    .where("passwordResetExpires")
    .gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash("errors", {
          msg: "Password reset token has expired or has expired"
        });
        return res.redirect("/forgot");
      }
      res.render("account/reset", { title: "Password Reset" });
    });
};
