"use client";

import { createElement, useEffect } from "react";

// The ElevenLabs Conversational AI agent (cold-call "Alex").
const AGENT_ID = "agent_0101kymwezq6eg4v91cnf5ed5j3p";

export default function AlexWidget() {
  useEffect(() => {
    const id = "elevenlabs-convai-widget-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://elevenlabs.io/convai-widget/index.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Custom element — createElement avoids the JSX intrinsic-element type error.
  return createElement("elevenlabs-convai", { "agent-id": AGENT_ID });
}
