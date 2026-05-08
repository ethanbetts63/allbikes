import { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import YouTube from 'react-youtube';
import { Spinner } from '@/components/ui/spinner';
import type { MediaGalleryProps } from '@/types/MediaGalleryProps';

const MediaGallery = ({ videoId, images, selectedMedia, onSelect, altText, overlay }: MediaGalleryProps) => {
    const [imageLoading, setImageLoading] = useState(false);

    useEffect(() => {
        if (selectedMedia && selectedMedia !== 'YOUTUBE') {
            setImageLoading(true);
        }
    }, [selectedMedia]);

    return (
        <div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3 bg-[var(--bg-light-secondary)]">
                {selectedMedia === 'YOUTUBE' && videoId ? (
                    <YouTube videoId={videoId} className="w-full h-full" opts={{ width: '100%', height: '100%' }} />
                ) : selectedMedia ? (
                    <>
                        {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Spinner className="h-8 w-8" />
                            </div>
                        )}
                        <img
                            src={selectedMedia}
                            alt={altText}
                            className={`w-full h-full object-contain transition-opacity duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setImageLoading(false)}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-light-secondary)]">
                        <span className="text-sm">No image available</span>
                    </div>
                )}
                {overlay}
            </div>

            <div className="flex gap-2 flex-wrap">
                {videoId && (
                    <button
                        onClick={() => onSelect('YOUTUBE')}
                        className={`relative w-20 h-20 overflow-hidden rounded-md ${selectedMedia === 'YOUTUBE' ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
                    >
                        <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt="YouTube video thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <PlayCircle className="h-8 w-8 text-[var(--text-light-primary)]" />
                        </div>
                    </button>
                )}
                {images.map((img, index) => (
                    <button
                        key={img.id}
                        onClick={() => onSelect(img.image)}
                        className={`w-20 h-20 overflow-hidden rounded-md ${selectedMedia === img.image ? 'ring-2 ring-[var(--highlight)]' : 'ring-1 ring-stone-200'}`}
                    >
                        <img
                            src={img.medium || img.image}
                            alt={`${altText} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MediaGallery;
