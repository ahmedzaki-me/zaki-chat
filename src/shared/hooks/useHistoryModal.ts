import { useEffect, useRef } from "react";

/**
 * Custom hook to handle mobile back button navigation for overlays/modals.
 * When the modal opens, it pushes a state to browser history.
 * When the user presses the hardware back button or swipes back on mobile,
 * popstate is caught, closing the modal without leaving the current chat page.
 * If closed programmatically (close button, swipe down), it cleans up history.back().
 */
export function useHistoryModal(
  isOpen: boolean,
  onClose: () => void,
  key = "modal-preview",
) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Push state so back gesture / back button triggers popstate instead of router navigation
    window.history.pushState({ [key]: true }, "");
    isPushedRef.current = true;

    const handlePopState = () => {
      isPushedRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (isPushedRef.current) {
        isPushedRef.current = false;
        // Step back so we don't leave lingering history states
        window.history.back();
      }
    };
  }, [isOpen, key]);
}
