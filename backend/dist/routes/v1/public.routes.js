"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = void 0;
const auth_controller_1 = require("../../controllers/auth.controller");
const auth_controller_2 = require("../../controllers/officer/auth.controller");
const auth_controller_3 = require("../../controllers/victim/auth.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const bns_controller_1 = require("../../controllers/public/bns.controller");
const crimeClassification_controller_1 = require("../../controllers/public/crimeClassification.controller");
exports.publicRoutes = [
    // Auth
    { method: 'POST', path: '/api/auth/login', handler: auth_controller_1.loginController },
    { method: 'POST', path: '/api/auth/victim/register', handler: auth_controller_3.victimRegisterController },
    { method: 'POST', path: '/api/auth/officer/register', handler: auth_controller_2.officerRegisterController },
    { method: 'POST', path: '/api/auth/refresh', handler: auth_controller_1.refreshController },
    { method: 'POST', path: '/api/auth/logout', handler: auth_controller_1.logoutController },
    { method: 'GET', path: '/api/auth/me', handler: auth_controller_1.meController },
    // BNS/IPC Translator
    { method: 'POST', path: '/api/bns/search', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.searchBNS) },
    { method: 'POST', path: '/api/bns/section', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.getBNSBySectionNumber) },
    { method: 'POST', path: '/api/bns/details', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.getBNSSectionDetails) },
    { method: 'POST', path: '/api/bns/compare-ipc', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.compareBNSAndIPC) },
    { method: 'GET', path: '/api/bns/categories', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.getAllBNSSectionsByCategory) },
    { method: 'GET', path: '/api/bns/changes', handler: (0, asyncHandler_1.asyncHandler)(bns_controller_1.PublicBNSController.getKeyChangesFromIPCtoBNS) },
    // Crime Classification
    { method: 'POST', path: '/api/classify/statement', handler: (0, asyncHandler_1.asyncHandler)(crimeClassification_controller_1.CrimeClassificationController.classifyStatement) },
    { method: 'POST', path: '/api/classify/get', handler: (0, asyncHandler_1.asyncHandler)(crimeClassification_controller_1.CrimeClassificationController.getClassification) },
    { method: 'POST', path: '/api/classify/update', handler: (0, asyncHandler_1.asyncHandler)(crimeClassification_controller_1.CrimeClassificationController.updateScore) },
];
