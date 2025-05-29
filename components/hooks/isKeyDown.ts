import { useEffect, useState } from "react";

const isKeyDown = (key: string): boolean => {
  const [keyDown, setKeyDown] = useState(false);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === key) {
      setKeyDown(true);
    }
  };
  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === key) {
      setKeyDown(false);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return keyDown;
};

export default isKeyDown;
