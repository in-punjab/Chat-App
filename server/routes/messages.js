const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');

// Get messages between logged in user and another user
router.get('/:userId', auth, async (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.userId;

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
      )
      .eq('deleted_for_everyone', false)  // exclude deleted for everyone
      .not('deleted_for', 'cs', `{"${myId}"}`) // exclude deleted for me
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete for me only
router.delete('/:messageId/me', auth, async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user.id;

  try {
    // Add my ID to deleted_for array
    const { data, error } = await supabase.rpc('append_deleted_for', {
      message_id: messageId,
      user_id: myId
    });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete for everyone (only sender can do this)
router.delete('/:messageId/everyone', auth, async (req, res) => {
  const { messageId } = req.params;
  const myId = req.user.id;

  try {
    // Verify requester is the sender
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    if (message.sender_id !== myId)
      return res.status(403).json({ error: 'Only sender can delete for everyone' });

    const { error } = await supabase
      .from('messages')
      .update({ deleted_for_everyone: true })
      .eq('id', messageId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;