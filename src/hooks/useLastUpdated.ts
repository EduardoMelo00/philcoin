"use client";

import { useState, useEffect, useCallback } from "react";

export function useLastUpdated(dataUpdatedAt: number | undefined) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  const calculateSeconds = useCallback(() => {
    if (!dataUpdatedAt) return 0;
    return Math.floor((Date.now() - dataUpdatedAt) / 1000);
  }, [dataUpdatedAt]);

  useEffect(() => {
    setSecondsAgo(calculateSeconds());
    const interval = setInterval(() => {
      setSecondsAgo(calculateSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateSeconds]);

  return secondsAgo;
}
