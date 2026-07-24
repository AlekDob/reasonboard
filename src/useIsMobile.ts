import { useEffect, useState } from "react";

/** true sotto la soglia — phone + iPad (anche landscape 12.9") */
export function useIsMobile(maxWidth = 1366) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${maxWidth}px)`).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [maxWidth]);

  return mobile;
}
