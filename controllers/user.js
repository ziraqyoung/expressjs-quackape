const validator = require("validator");
const passport = require("passport");
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
