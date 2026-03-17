export interface NYCEvent {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    price?: string;
    priceValue?: number;
    imageUrl: string;
    category: string;
    isPopular?: boolean;
    thisWeek?: boolean;
}
