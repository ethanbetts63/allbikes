"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlayCircle } from 'lucide-react';
import type { MediaGalleryProps } from '@/types/MediaGalleryProps';

const YouTube = dynamic(() => import('react-youtube'), {
    ssr: false,
});

const MediaGallery = ({ videoId, images, initialSelectedMedia, altText, overlay }: MediaGalleryProps) => {
    const [selectedMedia, setSelectedMedia] = useState(initialSelectedMedia);

    const selectMedia = (media: string) => {
        setSelectedMedia(media);
    };

    return (
        <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-[var(--bg-light-secondary)]">
                {selectedMedia === 'YOUTUBE' && videoId ? (
                    <YouTube videoId={videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                ) : selectedMedia ? (
                    <img
                        src={selectedMedia}
                        alt={altText}
                        fetchPriority="high"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-light-secondary)]">
                        <span className="text-sm">No image available</span>
                    </div>
                )}
                {overlay}
            </div>

            <div className="flex gap-2 flex-wrap">
                {images.map((img, index) => (
                    <GalleryThumbnail
                        key={img.id}
                        imageUrl={img.medium || img.image}
                        isSelected={selectedMedia === (img.medium || img.image)}
                        onSelect={() => selectMedia(img.medium || img.image)}
                        alt={`${altText} thumbnail ${index + 1}`}
                        videoId={index === 0 ? videoId : null}
                        isVideoSelected={selectedMedia === 'YOUTUBE'}
                        onSelectVideo={() => selectMedia('YOUTUBE')}
                    />
                ))}
                {videoId && images.length === 0 && (
                    <VideoThumbnail
                        videoId={videoId}
                        isSelected={selectedMedia === 'YOUTUBE'}
                        onSelect={() => selectMedia('YOUTUBE')}
                    />
                )}
            </div>
        </div>
    );
};

interface GalleryThumbnailProps {
    imageUrl: string;
    isSelected: boolean;
    onSelect: () => void;
    alt: string;
    videoId: string | null;
    isVideoSelected: boolean;
    onSelectVideo: () => void;
}

const GalleryThumbnail = ({
    imageUrl,
    isSelected,
    onSelect,
    alt,
    videoId,
    isVideoSelected,
    onSelectVideo,
}: GalleryThumbnailProps) => (
    <>
        <button
            onClick={onSelect}
            className={`w-20 h-20 overflow-hidden rounded-md ${isSelected ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
        >
            <img
                src={imageUrl}
                alt={alt}
                className="w-full h-full object-cover"
            />
        </button>
        {videoId && (
            <VideoThumbnail
                videoId={videoId}
                isSelected={isVideoSelected}
                onSelect={onSelectVideo}
            />
        )}
    </>
);

interface VideoThumbnailProps {
    videoId: string;
    isSelected: boolean;
    onSelect: () => void;
}

const VideoThumbnail = ({ videoId, isSelected, onSelect }: VideoThumbnailProps) => (
    <button
        onClick={onSelect}
        className={`relative w-20 h-20 overflow-hidden rounded-md ${isSelected ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
    >
        <img
            src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
            alt="YouTube video thumbnail"
            loading="lazy"
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <PlayCircle className="h-8 w-8 text-[var(--text-light-primary)]" />
        </div>
    </button>
);

export default MediaGallery;
