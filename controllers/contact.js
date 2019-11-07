const validator = require("validator");
const nodemailer = require("nodemailer");
/**
 * GET /contact
 * Contact form page
 */
exports.getContact = (req, res) => {
  const unknownUser = !req.user;
  res.render("contact", { title: "Contact", unknownUser });
};
/**
 * POST /contact
 * Send email via Nodemailer
 */
exports.postContact = (req, res) => {
  const validationErrors = [];
  let fromName;
  let fromEmail;
  if (!req.user) {
    if (validator.isEmpty(req.body.name))
      validationErrors.push({ msg: "Please enter your name" });
    if (!validator.isEmail(req.body.email))
      validationErrors.push({ msg: "Please enter a valid email address" });
  }
  if (validator.isEmpty(req.body.message))
    validationErrors.push({ msg: "Please enter your message" });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/contact");
  }

  if (!req.user) {
    fromName = req.body.name;
    fromEmail = req.body.email;
  } else {
    fromName = req.user.profile.name;
    fromEmail = req.user.email || "";
  }

  const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
      user: process.env.SENDGRID_USER,
      pass: process.env.SENDGRID_PASSWORD
    }
  });
  const mailOptions = {
    to: "mail@email.com",
    from: `${fromName} < ${fromEmail}`,
    subject: "Quackape App",
    text: req.body.message
  };
  return transporter
    .sendMail(mailOptions)
    .then(() => {
      req.flash("success", { msg: "Message has been sent successfully" });
      res.redirect("/contact");
    })
    .catch(err => {
      if (err.message === "self signed certificate in certificate chain") {
        console.log(
          "WARNING: self signed certificate in certificate chain. Retrying with self signed certificate. Use a valid certificate in production"
        );
        transporter = nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD
          },
          tls: {
            rejectUnauthorised: false
          }
        });

        return transporter.sendMail(mailOptions);
      }
      console.log(
        "ERROR: Could not send contact email after successfull security downgrade \n",
        err
      );
      req.flash("errors", {
        msg: "Error sending message. Please try again shortly"
      });
      return false;
    })
    .then(result => {
      if (result) {
        req.flash("success", { msg: "Message has been sent successfully" });
        return res.redirect("/contact");
      }
    })
    .catch(err => {
      console.log("Could not send contact email.\n", err);
      req.flash("errors", {
        msg: "Error sending the message. Please try again shortly"
      });
      return res.redirect("/contact");
    });
};
