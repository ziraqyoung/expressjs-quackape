const { expect } = require("chai");
const sinon = require("sinon");
require("sinon-mongoose");

const User = require("../../models/User");

describe("User model", () => {
  it("should create a new user", done => {
    const UserMock = sinon.mock(
      new User({ email: "test@mail.com", password: "root" })
    );

    const user = UserMock.object;

    UserMock.expects("save").yields(null);

    user.save(err => {
      UserMock.verify();
      UserMock.restore();
      expect(err).to.be.null;
      done();
    });
  });

  it("return an error if the user is not created", done => {
    const UserMock = sinon.mock(
      new User({ email: "test@mail.com", password: "root" })
    );
    const user = UserMock.object;
    const expectedError = {
      name: "ValidationError"
    };

    UserMock.expects("save").yields(expectedError);

    user.save((err, result) => {
      UserMock.verify();
      UserMock.restore();
      expect(err.name).to.equal("ValidationError");
      expect(result).to.be.undefined;
      done();
    });
  });
});
