"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.victimRoutes = void 0;
const complaint_controller_1 = require("../../controllers/victim/complaint.controller");
const pipeline_controller_1 = require("../../controllers/victim/pipeline.controller");
const rights_controller_1 = require("../../controllers/victim/rights.controller");
const case_controller_1 = require("../../controllers/victim/case.controller");
const station_controller_1 = require("../../controllers/victim/station.controller");
exports.victimRoutes = [
    { method: 'POST', path: '/api/victim/statements', handler: complaint_controller_1.createStatementController },
    { method: 'POST', path: '/api/victim/ml/pipeline', handler: pipeline_controller_1.victimPipelineController },
    { method: 'GET', path: '/api/victim/statements/latest', handler: complaint_controller_1.latestStatementController },
    { method: 'POST', path: '/api/victim/classify', handler: complaint_controller_1.classifyStatementController },
    { method: 'POST', path: '/api/victim/resolution', handler: complaint_controller_1.resolutionController },
    { method: 'POST', path: '/api/victim/rights', handler: rights_controller_1.victimRightsController },
    { method: 'GET', path: '/api/victim/stations', handler: station_controller_1.victimStationsController },
    { method: 'GET', path: '/api/victim/cases', handler: case_controller_1.victimCasesController },
    { method: 'GET', path: '/api/victim/cases/track', handler: case_controller_1.victimCaseTrackController },
];
