const express = require('express');
const callLogController = require('../controllers/callLogController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, callLogController.getCallLogs);

router.get('/stats', auth, callLogController.getCallLogStats);

router.get('/channel/:channelId', auth, callLogController.getChannelCallLogs);

module.exports = router;