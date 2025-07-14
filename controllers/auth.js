const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const userSchema = require("../schemas/userSchema");
const User = new mongoose.model("User", userSchema);
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model("Division", require("../schemas/divisionSchema"));
const Position = mongoose.model("Position", require("../schemas/positionSchema"));
const Role = mongoose.model("Role", require("../schemas/roleSchema"));

// show register page
const register = async (request, response, next) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    response.render("../views/auth/register", {
      title: "Register",
      name: "register",
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/auth/auth_layout.ejs",
    });
  } catch (error) {
    console.error(error);
    response.render("../views/auth/register", {
      title: "Register",
      name: "register",
      layout: "../views/auth/auth_layout.ejs",
    });
  }
};

// sign up user
const signup = async (request, response, next) => {
  try {
    // Find or create default role based on branch, division, position
    let role = await Role.findOne({
      branch_id: request.body.branch_id,
      division_id: request.body.division_id,
      position_id: request.body.position_id,
      isActive: true
    });

    if (!role) {
      // Create a default role if not exists
      const branch = await Branch.findById(request.body.branch_id);
      const division = await Division.findById(request.body.division_id);
      const position = await Position.findById(request.body.position_id);
      
      role = new Role({
        name: `${position.name} - ${division.name} - ${branch.name}`,
        description: `Default role for ${position.name} in ${division.name} at ${branch.name}`,
        branch_id: request.body.branch_id,
        division_id: request.body.division_id,
        position_id: request.body.position_id,
        isActive: true
      });
      await role.save();
    }

    let userInfo = {
      name: request.body.name,
      email: request.body.email,
      branch_id: request.body.branch_id,
      division_id: request.body.division_id,
      position_id: request.body.position_id,
      role_id: role._id
    };

    let hashedPassword = "";
    if (request.body.password !== "") {
      hashedPassword = await bcrypt.hash(request.body.password, 12);
    }

    let user = new User({ ...userInfo, password: hashedPassword });
    await user.save();

    request.session.user = {
      name: userInfo.name,
      email: userInfo.email,
      branch_id: userInfo.branch_id,
      division_id: userInfo.division_id,
      position_id: userInfo.position_id,
      role_id: userInfo.role_id
    };
    request.session.save();
    
    response.redirect(
      response.locals.base + "dashboard/analytics/" + response.getLocale()
    );
  } catch (error) {
    console.error(error);
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    response.render("../views/auth/register", {
      title: "Register",
      name: "register",
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/auth/auth_layout.ejs",
      errors: error.errors,
      input: {
        name: request.body.name,
        email: request.body.email,
        password: request.body.password,
        branch_id: request.body.branch_id,
        division_id: request.body.division_id,
        position_id: request.body.position_id
      },
    });
  }
};

// login page
const login = (request, response, next) => {
  response.render("../views/auth/login", {
    title: "Login",
    name: "login",
    layout: "../views/auth/auth_layout.ejs",
  });
};

// authenticate user
const authenticate = async (request, response, next) => {
  const email = request.body.email;
  const password = request.body.password;
  
  try {
    let findUser = await User.findOne({ email: email, isActive: true })
      .populate('role_id');
    
    if (!findUser) {
      request.session.errorMessage = "Email doesn't belong to any account!";
      return response.redirect(response.locals.base);
    }
    
    let matchPassword = await bcrypt.compare(password, findUser.password);
    if (!matchPassword) {
      request.session.errorMessage = "Wrong Credentials!";
      return response.redirect(response.locals.base);
    }

    // Update last login
    findUser.lastLogin = new Date();
    await findUser.save();

    let userInfo = {
      name: findUser.name,
      email: findUser.email,
      branch_id: findUser.branch_id,
      division_id: findUser.division_id,
      position_id: findUser.position_id,
      role_id: findUser.role_id?._id
    };
    
    request.session.user = userInfo;
    request.session.save();

    console.log(`User ${findUser.email} logged in successfully at ${new Date().toISOString()}`);
    
    response.redirect(
      response.locals.base + "dashboard/analytics/" + response.getLocale()
    );
  } catch (error) {
    console.log(error);
    request.session.errorMessage = "Authentication failed!";
    response.redirect(response.locals.base);
  }
};

// sign out user
const signOut = (request, response, next) => {
  request.session.destroy();
  return response.redirect(response.locals.base);
};

// password reset page
const passwordReset = (request, response, next) => {
  response.render("../views/auth/password_reset", {
    title: "Password Reset",
    name: "password_reset",
    layout: "../views/auth/auth_layout.ejs",
  });
};

module.exports = {
  register,
  signup,
  login,
  passwordReset,
  authenticate,
  signOut,
};