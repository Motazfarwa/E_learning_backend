const path = require("path");
const { helper, checkuser } = require("../helper/helper");
const { userModel } = require("../Models/user.model");
const bcryptjs = require("bcryptjs");



const Register = async (req, res) => {
    try {
      const { email, password, FullName } = req.body;
  
      // Check if the user already exists
      const exist = await checkuser(email);
      if (exist) {
        return res.status(409).send("User already exists");
      }
  
      // Hash the password
      const hash = await bcryptjs.hash(password, 10);
      req.body.password = hash;
  
      // Create the new user
      const user = await userModel.create({ ...req.body, FullName });
  
      // Respond with the created user
      res.status(201).send(user);
    } catch (error) {
      console.error(error); // Log error for debugging
      res.status(500).send("Server error");
    }
  };
const login = async (req, res) => {
    try {
      // Find the user
      const existingUser = await checkuser(req.body.email);
      if (!existingUser) {
        return res.status(404).send("User not found");
      }
  
      // Compare passwords
      const compare = await bcrypt.compare(req.body.password, existingUser.password);
      if (!compare) {
        return res.status(400).send("Password does not match");
      }
  
      // Create JWT token
      const payload = {
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role
      };
      const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "72h" });
  
      res.send({ token ,user: payload });
    } catch (error) {
      // Log error for debugging
      console.error(error);
      res.status(500).send("Server error");
    }
  };
  

const findAll = async (req, res) => {
   try {
     // Use find() to get all users and exclude the password field
     const users = await userModel.find().select("-password"); 
     res.send(users);
   } catch (error) {
     res.status(500).send(error);
   }
 };
 const getuserbyid = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

    
 const deleteuser = async (req, res) => {
   try {
     const deletedUser = await userModel.findByIdAndDelete(req.params.id);
     if (!deletedUser) {
       return res.status(404).send("User not found");
     }
     return res.json(deletedUser);
   } catch (error) {
     res.status(500).send(error);
   }
 };
 
 

const getAlluser = async (req, res) => {
   try {
     const users = await userModel.find().select("-password");
     res.send(users);
   } catch (error) {
     console.error(error); // Log error for debugging
     res.status(500).send("Server error");
   }
 };

 // Controller to handle profile image upload
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // File path
    const profileImagePath = path.join('', req.file.filename);

    // Update user with new image path
    const user = await userModel.findByIdAndUpdate(userId, { profileImage: profileImagePath }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send success response with updated user data
    res.status(200).json({ message: 'Profile image uploaded successfully', user });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports.authcontroller= {
 Register, login
}