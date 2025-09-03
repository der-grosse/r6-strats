import React from "react";

const useDelayed = <T>(
  value: T,
  {
    debounceDelay = 1000,
    onChange,
    defaultValue,
  }: {
    debounceDelay?: number;
    onChange?: (value: T) => void;
    defaultValue?: T;
  } = {
    debounceDelay: 1000,
    onChange: undefined,
    defaultValue: value,
  }
) => {
  const [deplayedValue, setDelayedValue] = React.useState(
    defaultValue ?? value
  );

  // debounce handler
  React.useEffect(() => {
    const handler = setTimeout(() => {
      onChange?.(value);
      setDelayedValue(value);
    }, debounceDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, debounceDelay]);

  // call when component unmounts
  React.useEffect(() => {
    return () => {
      onChange?.(value);
    };
  }, []);

  return {
    value: deplayedValue,
    skipDebounce: (newValue?: T) => setDelayedValue(newValue ?? value),
  };
};

export default useDelayed;
