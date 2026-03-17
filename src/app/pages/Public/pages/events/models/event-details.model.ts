export interface EventTier {
    id?: number;
    name: string;
    description?: string;
    price: number;
    quantityAvailable?: number;
    minPerOrder?: number;
    maxPerOrder?: number;
    saleStart?: string;
    saleEnd?: string;
}

export interface EventStaff {
    id: number;
    username: string;
    fullName: string;
    imageUrl?: string;
    type: number;
}

export interface EventAddress {
    street: string;
    buildingNumber?: string;
    zipCode: string;
    location?: {
        neighborhood: string;
        borough: string;
    };
}

export interface EventDetail {
    id: number;
    title: string;
    description: string;
    category: number;
    type: number;
    startDateTime: string;
    endDateTime: string;
    status: number;
    visibility: number;
    attachments: string[];
    address?: EventAddress | null;
    tiers: EventTier[];
    staff: EventStaff[];
    totalTicketsSold: number;
    ownerId: number;
    venueName?: string; // Sometimes provided separately or part of address logic
}
