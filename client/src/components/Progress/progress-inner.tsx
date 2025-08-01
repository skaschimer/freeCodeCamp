import React, { useState, useEffect, useRef, useMemo } from 'react';

import BezierEasing from 'bezier-easing';
import { ProgressBar } from './progress-bar';

interface ProgressInnerProps {
  completedPercent: number;
  title: string;
  meta: string;
}

const easing = BezierEasing(0.2, 0.5, 0.4, 1);
const intervalLength = 10;
let percent = 0;

function useIsInViewport(ref: React.RefObject<HTMLDivElement>) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observer = useMemo(
    () =>
      new IntersectionObserver(([entry]) =>
        setIsIntersecting(entry.isIntersecting)
      ),
    []
  );

  useEffect(() => {
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref, observer]);

  return isIntersecting;
}
function ProgressInner({
  completedPercent,
  title,
  meta
}: ProgressInnerProps): JSX.Element {
  const [shownPercent, setShownPercent] = useState(0);
  const [lastShownPercent, setLastShownPercent] = useState(0);
  const progressInnerWrap = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const isProgressInViewport = useIsInViewport(progressInnerWrap);

  const animateProgressInner = (completedPercent: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (completedPercent > 100) completedPercent = 100;
    if (completedPercent < 0) completedPercent = 0;

    const transitionLength = completedPercent * 10 + 750;
    const intervalsToFinish = transitionLength / intervalLength;
    const amountPerInterval = completedPercent / intervalsToFinish;

    intervalRef.current = window.setInterval(() => {
      percent += amountPerInterval;

      if (percent > completedPercent) percent = completedPercent;

      setShownPercent(
        Math.round(completedPercent * easing(percent / completedPercent))
      );
      if (percent >= completedPercent) {
        percent = 0;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, intervalLength);
  };

  useEffect(() => {
    if (lastShownPercent !== completedPercent && isProgressInViewport) {
      setLastShownPercent(completedPercent);
      animateProgressInner(completedPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProgressInViewport]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div className='completion-block-name'>{title}</div>
      <div
        className='progress-bar-wrap'
        aria-hidden='true'
        ref={progressInnerWrap}
      >
        <ProgressBar now={shownPercent} />
      </div>
      <div className='completion-block-meta'>{meta}</div>
    </>
  );
}

ProgressInner.displayName = 'ProgressInner';

export default ProgressInner;
