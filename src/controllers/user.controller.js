const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require("../utils/logger");

const userController = {
    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find()
                .select('-password')
                .populate('groupId');

            res.json({
                status: 'success',
                data: { users }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Get user by ID
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
                .select('-password')
                .populate('groupId');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Create new user
    createUser: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    errors: errors.array()
                });
            }

            const { username, email, password, role, groupId } = req.body;

            // Check if user exists
            let user = await User.findOne({ $or: [{ email }, { username }] });
            if (user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User already exists'
                });
            }

            // Create user
            user = new User({
                username,
                email,
                password,
                role,
                groupId
            });

            await user.save();

            res.status(201).json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        groupId: user.groupId
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Update user
    updateUser: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    errors: errors.array()
                });
            }

            const { username, email, role, groupId } = req.body;

            // Check if user exists
            let user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Check if email/username is taken by another user
            const existingUser = await User.findOne({
                $and: [
                    { _id: { $ne: req.params.id } },
                    { $or: [{ email }, { username }] }
                ]
            });

            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email or username is already taken'
                });
            }

            // Update user
            user.username = username;
            user.email = email;
            user.role = role;
            user.groupId = groupId;

            await user.save();

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        groupId: user.groupId
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            await user.remove();

            res.json({
                status: 'success',
                message: 'User deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Toggle user status
    toggleUserStatus: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            user.isActive = !user.isActive;
            await user.save();

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Update user group
    updateUserGroup: async (req, res) => {
        try {
            const { groupId } = req.body;
            
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            user.groupId = groupId;
            await user.save();

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        groupId: user.groupId
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Get user online status
    getUserStatus: async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId).select('isOnline lastActive username');

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            res.json({
                status: 'success',
                data: {
                    userId: user._id,
                    username: user.username,
                    isOnline: user.isOnline,
                    lastActive: user.lastActive
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Get all online users
    getOnlineUsers: async (req, res) => {
        try {
            const onlineUsers = await User.find({ isOnline: true })
                .select('_id username isOnline lastActive');

            res.json({
                status: 'success',
                data: {
                    users: onlineUsers
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Count online users
    countOnlineUsers: async (req, res) => {
        try {
            const onlineUsers = await User.countDocuments({ isOnline: true });

            logger.info(`Online users count: ${onlineUsers}`);
            res.json({
                status: 'success',
                data: {
                    count: onlineUsers
                }
            });
        } catch (error) {
            logger.error('Error counting online users:', error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
};

module.exports = userController;
