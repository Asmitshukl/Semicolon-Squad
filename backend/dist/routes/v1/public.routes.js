"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRoutes = void 0;
const auth_controller_1 = require("../../controllers/auth.controller");
const auth_controller_2 = require("../../controllers/admin/auth.controller");
const auth_controller_3 = require("../../controllers/officer/auth.controller");
const auth_controller_4 = require("../../controllers/victim/auth.controller");
exports.publicRoutes = [
    { method: 'POST', path: '/api/auth/login', handler: auth_controller_1.loginController },
    { method: 'POST', path: '/api/auth/victim/register', handler: auth_controller_4.victimRegisterController },
    { method: 'POST', path: '/api/auth/officer/register', handler: auth_controller_3.officerRegisterController },
    { method: 'POST', path: '/api/auth/admin/register', handler: auth_controller_2.adminRegisterController },
    { method: 'POST', path: '/api/auth/refresh', handler: auth_controller_1.refreshController },
    { method: 'POST', path: '/api/auth/logout', handler: auth_controller_1.logoutController },
    { method: 'GET', path: '/api/auth/me', handler: auth_controller_1.meController },
];
