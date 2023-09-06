'use strict';
const router = require('express').Router();
const {
    metaWebhookCallbackURL,
    handleMetaWebhookCallback,
} = require('../controllers/meta');

router.get('/meta_wa_driports_callbackurl', metaWebhookCallbackURL);

router.post('/meta_wa_driports_callbackurl', handleMetaWebhookCallback);

module.exports = router;
