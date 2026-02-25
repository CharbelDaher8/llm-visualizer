import { useState, useCallback, useRef, type RefObject, type MouseEvent as ReactMouseEvent } from 'react';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const ZOOM_SENSITIVITY = 0.001;

export function useCanvasTransform(containerRef: RefObject<HTMLElement | null>) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setTransform(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta)));
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
      };
    });
  }, [containerRef]);

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const fitToScreen = useCallback((graphWidth: number, graphHeight: number, containerWidth: number, containerHeight: number) => {
    if (graphWidth === 0 || graphHeight === 0) return;
    const padX = 80;
    const padY = 80;
    const scaleX = (containerWidth - padX) / graphWidth;
    const scaleY = (containerHeight - padY) / graphHeight;
    const scale = Math.min(scaleX, scaleY, 1.5);
    const x = (containerWidth - graphWidth * scale) / 2;
    const y = (containerHeight - graphHeight * scale) / 2 + 20;
    setTransform({ x, y, scale });
  }, []);

  return {
    transform,
    handleWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    fitToScreen,
  };
}
