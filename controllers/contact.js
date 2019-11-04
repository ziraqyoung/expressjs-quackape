/**
 * GET /contact
 * Contact form page
 */
exports.getContact = (req, res) => {
  const unknownUser = !req.user;
  res.render("contact", { title: "Contact", unknownUser });
};
