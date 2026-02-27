const { 
    getProfile, 
    updateProfile, 
    updateAvatar, 
    removeAvatar, 
    changePassword 
} = require("./profileController");

const { 
    getAllUsers, 
    toggleBlockUser 
} = require("./adminUserController");

module.exports = {
    // Profile Actions
    getProfile,
    updateProfile,
    updateAvatar,
    removeAvatar,
    changePassword,

    // Admin Actions
    getAllUsers,
    toggleBlockUser
};