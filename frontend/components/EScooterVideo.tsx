"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PlayCircle } from "lucide-react";

interface EScooterVideoProps {
  videoId: string;
}

const YouTube = dynamic(() => import("react-youtube"), {
  ssr: false,
});

const EScooterVideo = ({ videoId }: EScooterVideoProps) => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  if (shouldLoadVideo) {
    return (
      <YouTube
        videoId={videoId}
        className="w-full h-full"
        opts={{ width: "100%", height: "100%" }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label="Play electric scooter video"
      onClick={() => setShouldLoadVideo(true)}
      className="relative h-full w-full overflow-hidden bg-[var(--bg-dark-primary)] text-[var(--text-light-primary)]"
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        fetchPriority="low"
      />
      <span className="absolute inset-0 bg-black/30" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--highlight)] text-[var(--text-dark-primary)] shadow-lg">
          <PlayCircle className="h-9 w-9" />
        </span>
      </span>
    </button>
  );
};

export default EScooterVideo;
