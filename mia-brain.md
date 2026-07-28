# Mia Brain: Aljaz Editing Contract

**You edit Mia's words. We own the engine. Neither side sees the other's internals.**

You can change everything Mia *says* (her opener, her scripts, objection handling, the offer lines) without touching, seeing, or being able to reach our calling stack. You expose one endpoint that holds Mia's "brain." Our server polls it every 5 minutes, validates it, and merges the words into the live Mia. If you break it, you only break your own project's script, never our systems.

## What you build: one endpoint

```
GET  https://wedidit4you.com/api/mia-brain
     Auth: Bearer OUTREACH_AUTH_TOKEN   (the same token you already gave us)
     Returns: the mia_brain.json below (application/json)
```

- Back it with a store your Claude/admin can edit (a Supabase row, a KV, a file, whatever you like).
- Seed it with `mia_brain.seed.json` (attached). That is Mia's exact current live brain.
- To change how Mia talks, edit the JSON in your store. Our poller picks it up within 5 minutes.

## The shape (this is all there is)

```json
{
  "stages": {
    "specbuild": { "agent_name": "Mia", "forced_opener": "...", "campaign_instructions": "...", "calling_hours_start": "...", "calling_hours_end": "...", "service_description": "..." },
    "call2":     { ... same fields ... },
    "cold":      { ... same fields ... }
  }
}
```

- **specbuild** = call 1 when the site is already built (present-tense reveal).
- **call2** = the showcase + close call.
- **cold** = call 1 fallback when the site isn't built yet.
- Editable fields per stage: `agent_name`, `forced_opener`, `campaign_instructions`, `calling_hours_start`, `calling_hours_end`, `service_description`. Anything else you add is ignored.

## What our validator rejects (so a bad edit can't go live)
Every poll is validated. If any of these fail, the edit is **rejected**, the last-good brain stays live, and you + we get a Telegram alert:
- Any credential / URL / stack token in the words (`http`, `signalwire`, `api_token`, `project_id`, a `PT…`/`pit-…` key, etc.). The brain is **words only**. The engine, creds, and webhooks live on our side and are never in this file.
- Removing the DNC / opt-out handling from `campaign_instructions` on the two cold-outreach stages (compliance floor: Mia must always honor "take me off your list").
- Empty `agent_name`/`forced_opener`/`campaign_instructions`, or absurd lengths (opener > 2000 chars, instructions > 25000).

## What you never need (and never get)
The SignalWire creds, the Gemini engine, the outcome webhooks, the VPS, the other clients that share the caller, our internal costs. None of it is in this file or reachable from it. The `$450/$700` in the scripts are **your** customer offer prices, yours to change; our cost/margins aren't here at all.

## Verifying a change
When your edit applies, you get a Telegram diff. To *hear* it before a real prospect, ping us and we fire one test call to your Zoiper with the new brain. We don't auto-dial you on every edit.

That's the whole contract. Edit the words, commit to your store, and Mia updates herself within 5 minutes, safely, and without you ever seeing our stack.
