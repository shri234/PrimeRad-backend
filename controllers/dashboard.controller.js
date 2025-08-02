const User = require('../models/user.model')

// get Users
async function getUsers(req,res) {
    try{
        let getUsers = await User.find({});
        if(!getUsers){
            res.status(404).json({message:"Not Found"})
        }
        res.status(200).json({message:"Got Users Successfully",data:getUsers})
    }
    catch(err){
        res.status(404).json({message:"Not Found"})
    }
}

module.exports = {
    getUsers
}