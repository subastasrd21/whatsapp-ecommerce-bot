const STATES = require('../constants/states');
const answerMediaHandler = require('./answerMediaHandler');
const finalHandler = require('./finalHandler');
const initialHandler = require('./initialHandler');
const locationHandler = require('./locationHandler');
const mediaUploadHandler = require('./mediaUploadHandler');
const moreDetailsHandler = require('./moreDetailsHandler');
const reportDetailsHandler = require('./reportDetailsHandler');
const reportTypeHandler = require('./reportTypeHandler');
const vehicleHandler = require('./vehicleHandler');

const stateHandlers = {
    [STATES.INITIAL]: initialHandler,
    [STATES.VEHICLE_SELECTION]: vehicleHandler,
    [STATES.REPORT_TYPE_SELECTION]: reportTypeHandler,
    [STATES.REPORT_DETAILS]: reportDetailsHandler,
    [STATES.MORE_DETAILS]: moreDetailsHandler,
    [STATES.ANSWER_MEDIA]: answerMediaHandler,
    [STATES.MEDIA_UPLOAD]: mediaUploadHandler,
    [STATES.LOCATION_SELECTION]: locationHandler,
    [STATES.FINAL]: finalHandler,
};

module.exports = stateHandlers;
