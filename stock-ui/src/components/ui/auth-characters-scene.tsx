"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface PupilProps {
  mouseX: number;
  mouseY: number;
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({
  mouseX,
  mouseY,
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
}: PupilProps) => {
  const pupilRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

interface EyeBallProps {
  mouseX: number;
  mouseY: number;
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({
  mouseX,
  mouseY,
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) => {
  const eyeRef = useRef<HTMLDivElement>(null);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

export interface AuthCharactersSceneProps {
  compact?: boolean;
  isTyping?: boolean;
  privateMode?: boolean;
  className?: string;
}

export function AuthCharactersScene({
  compact = false,
  isTyping = false,
  privateMode = false,
  className,
}: AuthCharactersSceneProps) {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (x: number, y: number) => {
      setMouseX(x);
      setMouseY(y);
    };

    if (typeof window !== "undefined") {
      syncPointer(window.innerWidth / 2, window.innerHeight / 2);
    }

    const handlePointerMove = (e: PointerEvent) => {
      syncPointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      syncPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    let blinkTimeout = 0;
    let closeTimeout = 0;

    const scheduleBlink = () => {
      blinkTimeout = window.setTimeout(() => {
        setIsPurpleBlinking(true);
        closeTimeout = window.setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    };

    scheduleBlink();

    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    let blinkTimeout = 0;
    let closeTimeout = 0;

    const scheduleBlink = () => {
      blinkTimeout = window.setTimeout(() => {
        setIsBlackBlinking(true);
        closeTimeout = window.setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    };

    scheduleBlink();

    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return;
    }

    setIsLookingAtEachOther(true);
    const timer = window.setTimeout(() => {
      setIsLookingAtEachOther(false);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [isTyping]);

  useEffect(() => {
    if (!privateMode) {
      setIsPurplePeeking(false);
      return;
    }

    let mounted = true;
    let peekTimer = 0;
    let resetTimer = 0;

    const schedulePeek = () => {
      peekTimer = window.setTimeout(() => {
        if (!mounted) return;
        setIsPurplePeeking(true);
        resetTimer = window.setTimeout(() => {
          if (!mounted) return;
          setIsPurplePeeking(false);
          schedulePeek();
        }, 800);
      }, Math.random() * 3000 + 2000);
    };

    schedulePeek();

    return () => {
      mounted = false;
      window.clearTimeout(peekTimer);
      window.clearTimeout(resetTimer);
    };
  }, [privateMode]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const scale = compact ? 0.62 : 1;
  const frameWidth = Math.round(550 * scale);
  const frameHeight = Math.round(400 * scale);

  return (
    <div className={cn("relative", className)} style={{ width: `${frameWidth}px`, height: `${frameHeight}px` }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: "550px",
          height: "400px",
          transform: `scale(${scale})`,
        }}
      >
        <div
          ref={purpleRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: "70px",
            width: "180px",
            height: isTyping ? "440px" : "400px",
            backgroundColor: "#6C3FF5",
            borderRadius: "10px 10px 0 0",
            zIndex: 1,
            transform: privateMode
              ? "skewX(0deg)"
              : isTyping
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                : `skewX(${purplePos.bodySkew || 0}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="absolute flex gap-8 transition-all duration-700 ease-in-out"
            style={{
              left: privateMode ? "20px" : isLookingAtEachOther ? "55px" : `${45 + purplePos.faceX}px`,
              top: privateMode ? "35px" : isLookingAtEachOther ? "65px" : `${40 + purplePos.faceY}px`,
            }}
          >
            <EyeBall
              mouseX={mouseX}
              mouseY={mouseY}
              size={18}
              pupilSize={7}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isPurpleBlinking}
              forceLookX={privateMode ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
              forceLookY={privateMode ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
            />
            <EyeBall
              mouseX={mouseX}
              mouseY={mouseY}
              size={18}
              pupilSize={7}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isPurpleBlinking}
              forceLookX={privateMode ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
              forceLookY={privateMode ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
            />
          </div>
        </div>

        <div
          ref={blackRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: "240px",
            width: "120px",
            height: "310px",
            backgroundColor: "#2D2D2D",
            borderRadius: "8px 8px 0 0",
            zIndex: 2,
            transform: privateMode
              ? "skewX(0deg)"
              : isLookingAtEachOther
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                : isTyping
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                  : `skewX(${blackPos.bodySkew || 0}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="absolute flex gap-6 transition-all duration-700 ease-in-out"
            style={{
              left: privateMode ? "10px" : isLookingAtEachOther ? "32px" : `${26 + blackPos.faceX}px`,
              top: privateMode ? "28px" : isLookingAtEachOther ? "12px" : `${32 + blackPos.faceY}px`,
            }}
          >
            <EyeBall
              mouseX={mouseX}
              mouseY={mouseY}
              size={16}
              pupilSize={6}
              maxDistance={4}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isBlackBlinking}
              forceLookX={privateMode ? -4 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={privateMode ? -4 : isLookingAtEachOther ? -4 : undefined}
            />
            <EyeBall
              mouseX={mouseX}
              mouseY={mouseY}
              size={16}
              pupilSize={6}
              maxDistance={4}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isBlackBlinking}
              forceLookX={privateMode ? -4 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={privateMode ? -4 : isLookingAtEachOther ? -4 : undefined}
            />
          </div>
        </div>

        <div
          ref={orangeRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: "0px",
            width: "240px",
            height: "200px",
            zIndex: 3,
            backgroundColor: "#FF9B6B",
            borderRadius: "120px 120px 0 0",
            transform: privateMode ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="absolute flex gap-8 transition-all duration-200 ease-out"
            style={{
              left: privateMode ? "50px" : `${82 + (orangePos.faceX || 0)}px`,
              top: privateMode ? "85px" : `${90 + (orangePos.faceY || 0)}px`,
            }}
          >
            <Pupil
              mouseX={mouseX}
              mouseY={mouseY}
              size={12}
              maxDistance={5}
              pupilColor="#2D2D2D"
              forceLookX={privateMode ? -5 : undefined}
              forceLookY={privateMode ? -4 : undefined}
            />
            <Pupil
              mouseX={mouseX}
              mouseY={mouseY}
              size={12}
              maxDistance={5}
              pupilColor="#2D2D2D"
              forceLookX={privateMode ? -5 : undefined}
              forceLookY={privateMode ? -4 : undefined}
            />
          </div>
        </div>

        <div
          ref={yellowRef}
          className="absolute bottom-0 transition-all duration-700 ease-in-out"
          style={{
            left: "310px",
            width: "140px",
            height: "230px",
            backgroundColor: "#E8D754",
            borderRadius: "70px 70px 0 0",
            zIndex: 4,
            transform: privateMode ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="absolute flex gap-6 transition-all duration-200 ease-out"
            style={{
              left: privateMode ? "20px" : `${52 + (yellowPos.faceX || 0)}px`,
              top: privateMode ? "35px" : `${40 + (yellowPos.faceY || 0)}px`,
            }}
          >
            <Pupil
              mouseX={mouseX}
              mouseY={mouseY}
              size={12}
              maxDistance={5}
              pupilColor="#2D2D2D"
              forceLookX={privateMode ? -5 : undefined}
              forceLookY={privateMode ? -4 : undefined}
            />
            <Pupil
              mouseX={mouseX}
              mouseY={mouseY}
              size={12}
              maxDistance={5}
              pupilColor="#2D2D2D"
              forceLookX={privateMode ? -5 : undefined}
              forceLookY={privateMode ? -4 : undefined}
            />
          </div>
          <div
            className="absolute h-[4px] w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out"
            style={{
              left: privateMode ? "10px" : `${40 + (yellowPos.faceX || 0)}px`,
              top: privateMode ? "88px" : `${88 + (yellowPos.faceY || 0)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AuthCharactersScene;