// location.model.ts

export interface LocationModel {
    id: number;
    borough: string;
    code: string;
    neighborhoodNet: string;
    neighborhood: string;
    zipCode: number;
}

export interface LocationRequest {
    Borough: string;
    Code: string;
    NeighborhoodNet: string;
    Neighborhood: string;
    ZipCode: number;
}

export interface LocationListResponse {
    isSuccess: boolean;
    data: LocationModel[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    error: {
        code: string;
        message: string;
    } | null;
}

export interface LocationSingleResponse {
    isSuccess: boolean;
    data: any;
    error: {
        code: string;
        message: string;
    } | null;
}
