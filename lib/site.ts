// Single source of truth for the app's public origin.
//
// This MUST stay shared: the code that places calls (lib/outreach.ts) builds the
// SignalWire StatusCallback URL from this origin, and the webhook that verifies
// the SignalWire signature (app/api/webhooks/signalwire/call-status) rebuilds the
// same URL to check the HMAC. If the two ever derive the origin from different
// literals and one is changed, every signature silently fails (403). One constant
// makes that drift impossible.
export const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://wedidit4you.com";
