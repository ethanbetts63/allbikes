"use client";

import YouTube from "react-youtube";

interface EScooterVideoProps {
  videoId: string;
}

const EScooterVideo = ({ videoId }: EScooterVideoProps) => (
  <YouTube videoId={videoId} className="w-full h-full" opts={{ width: "100%", height: "100%" }} />
);

export default EScooterVideo;
