export interface GalleryImage {
    id: number;
    image: string;
    medium?: string;
    order: number;
}

export interface MediaGalleryProps {
    videoId: string | null;
    images: GalleryImage[];
    selectedMedia: string;
    onSelect: (media: string) => void;
    altText: string;
    overlay?: React.ReactNode;
}
