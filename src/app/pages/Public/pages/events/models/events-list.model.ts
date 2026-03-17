export enum EventCategory {
    Music = 1,
    Theater = 2,
    Sports = 3,
    FoodAndDrink = 4,
    Networking = 5,
    Community = 6,
    Outdoor = 7,
    Dance = 8
}

export enum EventStatus {
    Draft = 0,
    Published = 1,
    Cancelled = 2,
    Completed = 3,
    Archived = 4,
    Hidden = 5
}

export enum EventType {
    Venue = 0,
    Online = 1,
    ToBeAnnounced = 2
}

export interface LocationModel {
    id: number;
    borough: string;
    code: string;
    neighborhoodNet: string;
    neighborhood: string;
    zipCode: number;
}

export interface EventVenue {
    id: number;
    street: string;
    buildingNumber: string;
    zipCode: string;
    location: LocationModel;
    managedByUser: any;
}

export interface EventOrganizer {
    id: number;
    username: string;
    fullName: string;
    imageUrl: string;
    type: number;
}

export interface EventListItem {
    id: number;
    imageUrl: string | null;
    title: string;
    description: string;
    category: EventCategory;
    type: EventType;
    startDateTime: string;
    endDateTime: string;
    status: EventStatus;
    visibility: number | null;
    priceStart: number | null;
    priceEnd: number | null;
    saleStart: string | null;
    saleEnd: string | null;
    venue: EventVenue | null;
    primaryOrganizer: EventOrganizer | null;
}

export interface PaginatedEventResponse {
    isSuccess: boolean;
    data: EventListItem[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: any;
}
