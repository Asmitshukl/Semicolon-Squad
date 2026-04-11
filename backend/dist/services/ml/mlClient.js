"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteClassifyText = exports.remotePipelineAudio = exports.remotePipelineText = void 0;
const env_1 = require("../../config/env");
const normalize_1 = require("./normalize");
const joinUrl = (base, p) => `${base.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`;
const readJson = async (res) => {
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error(`ML service returned non-JSON (HTTP ${res.status}): ${text.slice(0, 240)}`);
    }
};
const withTimeout = (ms) => {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
};
/** Full stack: Whisper → NER → classifier → rights (Python `/v1/pipeline`). */
const remotePipelineText = async (rawText, language) => {
    const base = env_1.env.mlServiceUrl;
    if (!base) {
        throw new Error('ML_SERVICE_URL is not configured.');
    }
    const { signal, cancel } = withTimeout(env_1.env.mlServiceTimeoutMs);
    try {
        const res = await fetch(joinUrl(base, '/v1/pipeline/json'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                raw_text: rawText,
                rawComplaintText: rawText,
                language,
            }),
            signal,
        });
        cancel();
        if (!res.ok) {
            throw new Error(`ML pipeline failed (HTTP ${res.status}).`);
        }
        return (0, normalize_1.normalizeFullPipelineResponse)(await readJson(res));
    }
    catch (e) {
        cancel();
        throw e;
    }
};
exports.remotePipelineText = remotePipelineText;
const remotePipelineAudio = async (buffer, filename, mimeType, fields) => {
    const base = env_1.env.mlServiceUrl;
    if (!base) {
        throw new Error('ML_SERVICE_URL is not configured.');
    }
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
        if (v != null)
            form.set(k, v);
    }
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType || 'application/octet-stream' });
    form.set('audio', blob, filename || 'recording.webm');
    const { signal, cancel } = withTimeout(env_1.env.mlServiceTimeoutMs);
    try {
        const res = await fetch(joinUrl(base, '/v1/pipeline'), {
            method: 'POST',
            body: form,
            signal,
        });
        cancel();
        if (!res.ok) {
            throw new Error(`ML pipeline (audio) failed (HTTP ${res.status}).`);
        }
        return (0, normalize_1.normalizeFullPipelineResponse)(await readJson(res));
    }
    catch (e) {
        cancel();
        throw e;
    }
};
exports.remotePipelineAudio = remotePipelineAudio;
/** Classify text only (Python `/v1/classify`) — used after a text statement is saved. */
const remoteClassifyText = async (rawText, language) => {
    const base = env_1.env.mlServiceUrl;
    if (!base) {
        return null;
    }
    const { signal, cancel } = withTimeout(env_1.env.mlServiceTimeoutMs);
    try {
        const res = await fetch(joinUrl(base, '/v1/classify'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ raw_text: rawText, rawComplaintText: rawText, language }),
            signal,
        });
        cancel();
        if (!res.ok) {
            return null;
        }
        return (0, normalize_1.normalizeClassifyOnlyResponse)(await readJson(res));
    }
    catch {
        cancel();
        return null;
    }
};
exports.remoteClassifyText = remoteClassifyText;
