"use client";

import { useEffect, type RefObject } from "react";

// After a submit, move focus to the first invalid field, or to the status
// message, so keyboard and screen reader users land on the feedback. On a long
// form this also scrolls the message into view.
export function useFocusResult(
  formRef: RefObject<HTMLFormElement | null>,
  messageRef: RefObject<HTMLElement | null>,
  state: { status: string },
) {
  useEffect(() => {
    if (state.status === "idle") return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? messageRef.current)?.focus();
  }, [state, formRef, messageRef]);
}
