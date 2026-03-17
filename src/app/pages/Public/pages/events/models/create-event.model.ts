export interface CreateEventAddress {
    AddressId: number;
    LocationId: number;
    Street: string;
    BuildingNumber: string;
    ZipCode: string;
}

export interface CreateEventTier {
    Id: number;
    Name: string;
    Description: string;
    Price: number;
    QuantityAvailable: number;
    MinPerOrder: number;
    MaxPerOrder: number;
    SaleStart?: string | null;
    SaleEnd?: string | null;
}

export interface CreateEventRequest {
    Title: string;
    Description: string;
    Category: number;
    StartDateTime: string;
    EndDateTime: string;
    VenueName: string;
    Address: CreateEventAddress;
    Visibility: number;
    AccessPassword?: string;
    Tiers: CreateEventTier[];
    Attachments?: File[];
}
