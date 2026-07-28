"use client";

import { useEffect } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrl = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const matchMeta = shortcut.meta ? e.metaKey : true;
        const matchShift = shortcut.shift ? e.shiftKey : true;
        const matchAlt = shortcut.alt ? e.altKey : true;

        if (matchKey && matchCtrl && matchMeta && matchShift && matchAlt) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, enabled]);
}
