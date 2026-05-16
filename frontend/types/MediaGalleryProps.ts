export interface GalleryImage {
    id: number;
    image: string;
    thumbnail?: string | null;
    medium?: string;
    order: number;
}

export interface MediaGalleryProps {
    videoId: string | null;
    images: GalleryImage[];
    initialSelectedMedia: string;
    altText: string;
    overlay?: React.ReactNode;
}
