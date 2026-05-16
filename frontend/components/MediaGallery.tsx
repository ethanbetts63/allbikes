"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import type { MediaGalleryProps } from '@/types/MediaGalleryProps';

const YouTube = dynamic(() => import('react-youtube'), {
    ssr: false,
});

const MediaGallery = ({ videoId, images, initialSelectedMedia, altText, overlay }: MediaGalleryProps) => {
    const mediaItems = buildMediaItems(images, videoId, altText);
    const [selectedIndex, setSelectedIndex] = useState(() => {
        const initialIndex = mediaItems.findIndex((item) => item.src === initialSelectedMedia || (item.type === 'youtube' && initialSelectedMedia === 'YOUTUBE'));
        return initialIndex >= 0 ? initialIndex : 0;
    });
    const [showDesktopThumbnails, setShowDesktopThumbnails] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const updateThumbnailVisibility = () => setShowDesktopThumbnails(mediaQuery.matches);

        updateThumbnailVisibility();
        mediaQuery.addEventListener('change', updateThumbnailVisibility);
        return () => mediaQuery.removeEventListener('change', updateThumbnailVisibility);
    }, []);

    const selectedItem = mediaItems[selectedIndex] ?? null;
    const hasMultipleItems = mediaItems.length > 1;

    const selectPrevious = () => {
        setSelectedIndex((currentIndex) => (currentIndex - 1 + mediaItems.length) % mediaItems.length);
    };

    const selectNext = () => {
        setSelectedIndex((currentIndex) => (currentIndex + 1) % mediaItems.length);
    };

    return (
        <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-[var(--bg-light-secondary)]">
                {selectedItem?.type === 'youtube' ? (
                    <YouTube videoId={selectedItem.videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                ) : selectedItem?.type === 'image' ? (
                    <img
                        src={selectedItem.src}
                        alt={selectedItem.alt}
                        fetchPriority="high"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-light-secondary)]">
                        <span className="text-sm">No image available</span>
                    </div>
                )}
                {overlay}

                {hasMultipleItems && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous image"
                            onClick={selectPrevious}
                            className="md:hidden absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] shadow-lg backdrop-blur"
                        >
                            <ChevronLeft className="h-7 w-7" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next image"
                            onClick={selectNext}
                            className="md:hidden absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] shadow-lg backdrop-blur"
                        >
                            <ChevronRight className="h-7 w-7" />
                        </button>
                    </>
                )}
            </div>

            {showDesktopThumbnails && (
                <div className="hidden md:flex gap-2 flex-wrap">
                    {mediaItems.map((item, index) => (
                        <GalleryThumbnail
                            key={item.id}
                            item={item}
                            isSelected={selectedIndex === index}
                            onSelect={() => setSelectedIndex(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

type MediaItem =
    | {
        id: string;
        type: 'image';
        src: string;
        thumbnailSrc: string;
        alt: string;
    }
    | {
        id: string;
        type: 'youtube';
        src: 'YOUTUBE';
        thumbnailSrc: string;
        videoId: string;
        alt: string;
    };

function buildMediaItems(images: MediaGalleryProps['images'], videoId: string | null, altText: string): MediaItem[] {
    const imageItems = images.map((image, index) => {
        const src = image.medium || image.image;
        return {
            id: `image-${image.id}`,
            type: 'image' as const,
            src,
            thumbnailSrc: image.thumbnail || src,
            alt: `${altText} image ${index + 1}`,
        };
    });

    if (!videoId) return imageItems;

    const videoItem: MediaItem = {
        id: `youtube-${videoId}`,
        type: 'youtube',
        src: 'YOUTUBE',
        thumbnailSrc: `https://img.youtube.com/vi/${videoId}/0.jpg`,
        videoId,
        alt: 'YouTube video thumbnail',
    };

    if (imageItems.length === 0) return [videoItem];

    return [
        imageItems[0],
        videoItem,
        ...imageItems.slice(1),
    ];
}

interface GalleryThumbnailProps {
    item: MediaItem;
    isSelected: boolean;
    onSelect: () => void;
}

const GalleryThumbnail = ({
    item,
    isSelected,
    onSelect,
}: GalleryThumbnailProps) => (
    <button
        onClick={onSelect}
        className={`relative w-20 h-20 overflow-hidden rounded-md ${isSelected ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
    >
        <img
            src={item.thumbnailSrc}
            alt={item.alt}
            loading="lazy"
            fetchPriority="low"
            className="w-full h-full object-cover"
        />
        {item.type === 'youtube' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <PlayCircle className="h-8 w-8 text-[var(--text-light-primary)]" />
            </div>
        )}
    </button>
);

export default MediaGallery;
