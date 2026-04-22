/**
 * Injection detection utilities for the BitBadges AI builder agent.
 *
 * Ported from the indexer so both the agent and indexer share one
 * source of truth. Normalize-then-regex approach — handles
 * multi-line splitting, zero-width chars, and common homoglyph
 * bypasses.
 */

function normalizeForInjectionCheck(text: string): string {
  return (
    text
      .replace(/[​‌‍﻿]/g, '')
      .replace(/[ıíìï]/g, 'i')
      .replace(/[àáâãä]/g, 'a')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ùúûü]/g, 'u')
      .replace(/\s+/g, ' ')
      .toLowerCase()
  );
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|rules|prompts)/,
  /you\s+are\s+now\s+a/,
  /new\s+instructions?\s*:/,
  /system\s*prompt\s*:/,
  /\bdo\s+not\s+use\s+tools?\b/,
  /\boutput\s+raw\s+json\b/,
  /\breturn\s+the\s+system\s+prompt\b/,
  /\brepeat\s+(your|the)\s+(instructions|prompt|rules)\b/,
  /\bdisregard\b.*\b(instructions|rules|prompt)\b/,
  /\boverride\b.*\b(system|instructions|rules)\b/,
  /\bpretend\s+(you|to\s+be)\b/,
  /\brole\s*-?\s*play\b/,
  /\bjailbreak\b/,
  /\bdan\s*mode\b/,
  /\b(tell|show|reveal|display|print|leak)\b.*\b(system|instructions|prompt|rules)\b/,
  /\bwhat\s+(are|is)\s+(your|the)\s+(instructions|rules|prompt|system)\b/,
  /\bforget\b.*\b(everything|instructions|rules|prompt)\b/,
  /\b(start|begin)\s+(a\s+)?new\s+(conversation|session|context)\b/,
  /\byou\s+(must|should|will)\s+(only|always|never)\b.*\b(obey|listen|follow)\b/,
  /\benter\s+(developer|debug|admin|sudo|root)\s*mode\b/
];

export function containsInjection(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeForInjectionCheck(text);
  return INJECTION_PATTERNS.some((p) => p.test(normalized));
}
