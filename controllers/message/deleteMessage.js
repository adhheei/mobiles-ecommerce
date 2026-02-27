const Message = require("../../models/Message");

/**
 * @desc    Delete a specific contact message permanently
 * @route   DELETE /api/admin/messages/:id
 * @access  Private/Admin
 */
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        // Attempt to find and delete the message in one step
        const message = await Message.findByIdAndDelete(id);

        if (!message) {
            return res.status(404).json({ 
                success: false, 
                error: "Message not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Message deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        
        // Handle invalid MongoDB ObjectIDs
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid message ID format" 
            });
        }

        res.status(500).json({ 
            success: false, 
            error: "Internal server error while deleting message" 
        });
    }
};

module.exports = deleteMessage;