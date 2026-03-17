import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HousingService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/housing/create`;

    createHousingPost(data: any): Observable<any> {
        // ... legacy/generic method if needed, or we can redirect to specific ones
        // For now, keeping it but we will primarily use createRentingPost for the new page
        return this.createRentingPost(data);
    }

    createRentingPost(data: any): Observable<any> {
        const formData = new FormData();
        const apiUrl = `${environment.apiBaseUrl}/housing/create/renting`;

        // Helper to append integer strings - ALWAYS send a value
        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };

        // Helper to append strings - ALWAYS send a value (even if empty)
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

        // 1. Enums & Integers
        appendInt('HouseType', data.HouseType);
        appendInt('PropertyType', data.PropertyType);
        appendInt('BuildingType', data.BuildingType);
        appendInt('Bedrooms', data.Bedrooms);
        appendInt('Bathrooms', data.Bathrooms);
        appendInt('MonthlyRent', data.MonthlyRent);
        appendInt('SecurityDeposit', data.SecurityDeposit);
        appendInt('BrokerFee', data.BrokerFee);
        appendInt('MonthlyCostRange', data.MonthlyCostRange);
        appendInt('BuiltIn', data.BuiltIn);
        appendInt('RenovatedIn', data.RenovatedIn);
        appendInt('Sqft', data.Sqft);

        // FloorLevel Logic: Ground -> 0, 10+ -> 11, else int
        let floorVal = 0;
        if (data.FloorLevel === 'Ground') floorVal = 0;
        else if (data.FloorLevel === '10+') floorVal = 11;
        else floorVal = parseInt(data.FloorLevel, 10) || 0;
        formData.append('FloorLevel', String(floorVal));

        appendInt('Heating', data.Heating);
        appendInt('Cooling', data.Cooling);
        appendInt('TemperatureControl', data.TemperatureControl);
        appendInt('LeaseType', data.LeaseType);
        appendInt('PrivacyType', data.PrivacyType);
        appendInt('SharedBathroomType', data.SharedBathroomType);
        appendInt('SharedKitchenType', data.SharedKitchenType);
        appendInt('MaxOccupants', data.MaxOccupants);

        // 2. Strings
        appendString('Borough', data.Borough);
        appendString('ZipCode', data.ZipCode);
        appendString('Neighborhood', data.Neighborhood);
        appendString('FullAddress', data.FullAddress);
        appendString('UnitNumber', data.UnitNumber);
        appendString('GoogleMap', data.GoogleMap);
        appendString('Description', data.Description);
        appendString('AboutCurrentResident', data.AboutCurrentResident);
        appendString('UnitRulesAndPolicies', data.UnitRulesAndPolicies);
        appendString('RoommatesGroupChat', data.RoommatesGroupChat);
        appendString('DirectApplyLink', data.DirectApplyLink);

        // CoListing Logic: Send only if it has real values to avoid 400 errors
        if (data.CoListing && Array.isArray(data.CoListing) && data.CoListing.length > 0) {
            data.CoListing.forEach((id: any) => {
                if (id !== null && id !== undefined && id !== '') {
                    formData.append('CoListing', String(id));
                }
            });
        }
        // If empty, we skip it entirely. Swagger succeeds with '0' sometimes, but skipping is safer for Lists.

        // 3. Dates
        if (data.MoveInDate) formData.append('MoveInDate', new Date(data.MoveInDate).toISOString());
        if (data.MoveOutDate) formData.append('MoveOutDate', new Date(data.MoveOutDate).toISOString());

        // 4. Booleans
        const boolFields = [
            'ShortTermStayAllowed', 'ShortStayEligiblity', 'Furnished',
            'AcceptsHousingVouchers', 'FamilyAndKidsFriendly', 'PetsFriendly',
            'AccessibilityFriendly', 'SmokingAllowed', 'IsPublished',
            'AddDirectApplyLink', 'AllowColisterEditing'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

        // 5. Arrays (Match Swagger's default '0' for empty arrays in your CURL)
        const appendArrayOrZero = (key: string, arr: any[]) => {
            if (arr && Array.isArray(arr) && arr.length > 0) {
                arr.forEach(item => formData.append(key, String(item)));
            } else {
                formData.append(key, '0'); // Swagger sends 0 for these if unselected
            }
        };

        appendArrayOrZero('NearbyTransportation', data.NearbyTransportation);
        appendArrayOrZero('Laundry', data.Laundry);
        appendArrayOrZero('Amenities', data.Amenities);
        appendArrayOrZero('AcceptedHousingPrograms', data.AcceptedHousingPrograms);

        // 6. Photos
        if (data.Photos && Array.isArray(data.Photos) && data.Photos.length > 0) {
            data.Photos.forEach((file: any) => {
                if (file instanceof File) formData.append('Photos', file);
            });
        }
        return this.http.post(apiUrl, formData);
    }

    createSalePost(data: any): Observable<any> {
        const formData = new FormData();
        const apiUrl = `${environment.apiBaseUrl}/housing/create/sale`;

        // Helper to append integer strings - ALWAYS send a value
        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };

        // Helper to append strings - ALWAYS send a value (even if empty)
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

        // 1. Enums & Integers
        appendInt('HouseType', data.HouseType);
        appendInt('PropertyType', data.PropertyType);
        appendInt('BuildingType', data.BuildingType);
        appendInt('Bedrooms', data.Bedrooms);
        appendInt('Bathrooms', data.Bathrooms);
        appendInt('AskingPrice', data.AskingPrice);
        appendInt('DownPayment', data.DownPayment);
        appendInt('BrokerFee', data.BrokerFee);
        appendInt('MonthlyCostRange', data.MonthlyCostRange);
        appendInt('BuiltIn', data.BuiltIn);
        appendInt('RenovatedIn', data.RenovatedIn);
        appendInt('Sqft', data.Sqft);
        appendInt('FloorLevel', data.FloorLevel);
        appendInt('Heating', data.Heating);
        appendInt('Cooling', data.Cooling);
        appendInt('TemperatureControl', data.TemperatureControl);
        appendInt('SuggestedOccupants', data.SuggestedOccupants || data.MaxOccupants);
        appendInt('LegalUnitCount', data.LegalUnitCount);

        // 2. Strings
        appendString('Borough', data.Borough);
        appendString('ZipCode', data.ZipCode);
        appendString('Neighborhood', data.Neighborhood);
        appendString('FullAddress', data.FullAddress);
        appendString('UnitNumber', data.UnitNumber);
        appendString('GoogleMap', data.GoogleMap);
        appendString('Description', data.Description);
        appendString('DirectApplyLink', data.DirectApplyLink);

        // 3. Dates
        if (data.OpeningDate) formData.append('OpeningDate', new Date(data.OpeningDate).toISOString());

        // 4. Booleans
        const boolFields = [
            'Furnished', 'AcceptsHousingVouchers', 'FamilyAndKidsFriendly',
            'PetsFriendly', 'AccessibilityFriendly', 'SmokingAllowed',
            'AddDirectApplyLink', 'AllowColisterEditing', 'IsPublished'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

        // 5. Arrays (Match Swagger's default '0' for empty arrays)
        const appendArrayOrZero = (key: string, arr: any[]) => {
            if (arr && Array.isArray(arr) && arr.length > 0) {
                arr.forEach(item => formData.append(key, String(item)));
            } else {
                formData.append(key, '0');
            }
        };

        appendArrayOrZero('NearbyTransportation', data.NearbyTransportation);
        appendArrayOrZero('Laundry', data.Laundry);
        appendArrayOrZero('Amenities', data.Amenities);
        appendArrayOrZero('AcceptedBuyerPrograms', data.AcceptedBuyerPrograms);

        // CoListing Logic: Skip if empty
        if (data.CoListing && Array.isArray(data.CoListing) && data.CoListing.length > 0) {
            data.CoListing.forEach((id: any) => {
                if (id !== null && id !== undefined && id !== '') {
                    formData.append('CoListing', String(id));
                }
            });
        }

        // 6. Photos
        if (data.Photos && Array.isArray(data.Photos) && data.Photos.length > 0) {
            data.Photos.forEach((file: any) => {
                if (file instanceof File) formData.append('Photos', file);
            });
        }

        return this.http.post(apiUrl, formData);
    }

    getHousingHome(): Observable<any> {
        return this.http.get(`${environment.apiBaseUrl}/housing/home`);
    }

    getHousingFeed(params: any): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.append(key, params[key]);
            }
        });
        return this.http.get(`${environment.apiBaseUrl}/housing/feed`, { params: httpParams });
    }

    getHousingDetails(id: number | string): Observable<any> {
        return this.http.get(`${environment.apiBaseUrl}/housing/${id}`);
    }

    getAgentDashboard(): Observable<any> {
        return this.http.get(`${environment.apiBaseUrl}/housing/agent/dashboard`);
    }

    getAgentListings(page: number, pageSize: number): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        return this.http.get(`${environment.apiBaseUrl}/housing/agent/listings`, { params });
    }

    updateRentingPost(id: number, data: any): Observable<any> {
        const formData = new FormData();
        const apiUrl = `${environment.apiBaseUrl}/housing/${id}/edit/rent`;

        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

        // 1. Enums & Integers
        appendInt('HouseType', data.HouseType);
        appendInt('PropertyType', data.PropertyType);
        appendInt('BuildingType', data.BuildingType);
        appendInt('Bedrooms', data.Bedrooms);
        appendInt('Bathrooms', data.Bathrooms);
        appendInt('MonthlyRent', data.MonthlyRent);
        appendInt('SecurityDeposit', data.SecurityDeposit);
        appendInt('BrokerFee', data.BrokerFee);
        appendInt('MonthlyCostRange', data.MonthlyCostRange);
        appendInt('BuiltIn', data.BuiltIn);
        appendInt('RenovatedIn', data.RenovatedIn);
        appendInt('Sqft', data.Sqft);
        appendInt('MaxOccupants', data.MaxOccupants);
        appendInt('LeaseType', data.LeaseType);
        appendInt('PrivacyType', data.PrivacyType);
        appendInt('SharedBathroomType', data.SharedBathroomType);
        appendInt('SharedKitchenType', data.SharedKitchenType);
        appendInt('Heating', data.Heating);
        appendInt('Cooling', data.Cooling);
        appendInt('TemperatureControl', data.TemperatureControl);

        let floorVal = 0;
        if (data.FloorLevel === 'Ground') floorVal = 0;
        else if (data.FloorLevel === '10+') floorVal = 11;
        else floorVal = parseInt(data.FloorLevel, 10) || 0;
        formData.append('FloorLevel', String(floorVal));

        // 2. Strings
        appendString('Borough', data.Borough);
        appendString('ZipCode', data.ZipCode);
        appendString('Neighborhood', data.Neighborhood);
        appendString('FullAddress', data.FullAddress);
        appendString('UnitNumber', data.UnitNumber);
        appendString('GoogleMap', data.GoogleMap);
        appendString('Description', data.Description);
        appendString('AboutCurrentResident', data.AboutCurrentResident);
        appendString('UnitRulesAndPolicies', data.UnitRulesAndPolicies);
        appendString('RoommatesGroupChat', data.RoommatesGroupChat);
        appendString('DirectApplyLink', data.DirectApplyLink);

        // 3. Dates
        const appendDate = (key: string, val: any) => {
            if (!val) return;
            const d = new Date(val);
            if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
                formData.append(key, d.toISOString());
            }
        };
        appendDate('MoveInDate', data.MoveInDate);
        appendDate('MoveOutDate', data.MoveOutDate);

        // 4. Booleans
        const boolFields = [
            'ShortTermStayAllowed', 'ShortStayEligiblity', 'Furnished',
            'AcceptsHousingVouchers', 'FamilyAndKidsFriendly', 'PetsFriendly',
            'AccessibilityFriendly', 'SmokingAllowed', 'IsPublished',
            'AddDirectApplyLink', 'AllowColisterEditing'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

        // 5. Arrays - ALWAYS send '0' if empty to match Swagger/CURL
        const appendArrayOrZero = (key: string, arr: any[]) => {
            if (arr && Array.isArray(arr) && arr.length > 0) {
                arr.forEach(item => {
                    if (item !== null && item !== undefined && item !== '') formData.append(key, String(item));
                });
            } else {
                formData.append(key, '0');
            }
        };

        appendArrayOrZero('NearbyTransportation', data.NearbyTransportation);
        appendArrayOrZero('Laundry', data.Laundry);
        appendArrayOrZero('Amenities', data.Amenities);
        appendArrayOrZero('AcceptedHousingPrograms', data.AcceptedHousingPrograms);
        appendArrayOrZero('CoListing', data.CoListing);
        appendArrayOrZero('DeletedPhotoIds', data.DeletedPhotoIds);

        // 6. Photos
        if (data.NewPhotos && Array.isArray(data.NewPhotos)) {
            data.NewPhotos.forEach((file: any) => {
                if (file instanceof File) formData.append('NewPhotos', file);
            });
        }

        return this.http.put(apiUrl, formData);
    }

    updateSalePost(id: number, data: any): Observable<any> {
        const formData = new FormData();
        const apiUrl = `${environment.apiBaseUrl}/housing/${id}/edit/sale`;

        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

        // 1. Enums & Integers
        appendInt('HouseType', data.HouseType);
        appendInt('PropertyType', data.PropertyType);
        appendInt('BuildingType', data.BuildingType);
        appendInt('Bedrooms', data.Bedrooms);
        appendInt('Bathrooms', data.Bathrooms);
        appendInt('AskingPrice', data.AskingPrice);
        appendInt('DownPayment', data.DownPayment);
        appendInt('BrokerFee', data.BrokerFee);
        appendInt('MonthlyCostRange', data.MonthlyCostRange);
        appendInt('BuiltIn', data.BuiltIn);
        appendInt('RenovatedIn', data.RenovatedIn);
        appendInt('Sqft', data.Sqft);
        appendInt('FloorLevel', data.FloorLevel);
        appendInt('Heating', data.Heating);
        appendInt('Cooling', data.Cooling);
        appendInt('TemperatureControl', data.TemperatureControl);
        appendInt('SuggestedOccupants', data.SuggestedOccupants);
        appendInt('LegalUnitCount', data.LegalUnitCount);

        // 2. Strings
        appendString('Borough', data.Borough);
        appendString('ZipCode', data.ZipCode);
        appendString('Neighborhood', data.Neighborhood);
        appendString('FullAddress', data.FullAddress);
        appendString('UnitNumber', data.UnitNumber);
        appendString('GoogleMap', data.GoogleMap);
        appendString('Description', data.Description);
        appendString('DirectApplyLink', data.DirectApplyLink);

        // 3. Dates
        const appendDate = (key: string, val: any) => {
            if (!val) return;
            const d = new Date(val);
            if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
                formData.append(key, d.toISOString());
            }
        };
        appendDate('OpeningDate', data.OpeningDate);

        // 4. Booleans
        const boolFields = [
            'Furnished', 'AcceptsHousingVouchers', 'FamilyAndKidsFriendly',
            'PetsFriendly', 'AccessibilityFriendly', 'SmokingAllowed',
            'AddDirectApplyLink', 'AllowColisterEditing', 'IsPublished'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

        // 5. Arrays - ALWAYS send '0' if empty
        const appendArrayOrZero = (key: string, arr: any[]) => {
            if (arr && Array.isArray(arr) && arr.length > 0) {
                arr.forEach(item => {
                    if (item !== null && item !== undefined && item !== '') formData.append(key, String(item));
                });
            } else {
                formData.append(key, '0');
            }
        };

        appendArrayOrZero('NearbyTransportation', data.NearbyTransportation);
        appendArrayOrZero('Laundry', data.Laundry);
        appendArrayOrZero('Amenities', data.Amenities);
        appendArrayOrZero('AcceptedBuyerPrograms', data.AcceptedBuyerPrograms);
        appendArrayOrZero('CoListing', data.CoListing);
        appendArrayOrZero('DeletedPhotoIds', data.DeletedPhotoIds);

        // 6. Photos
        if (data.NewPhotos && Array.isArray(data.NewPhotos)) {
            data.NewPhotos.forEach((file: any) => {
                if (file instanceof File) formData.append('NewPhotos', file);
            });
        }

        return this.http.put(apiUrl, formData);
    }

    updateHousingPost(id: number, data: any): Observable<any> {
        // Fallback or generic method
        if (data.IsRenting) {
            return this.updateRentingPost(id, data);
        } else {
            return this.updateSalePost(id, data);
        }
    }

    createHousingAuthorization(data: any): Observable<any> {
        const formData = new FormData();
        const apiUrl = `${environment.apiBaseUrl}/housing/create/authoring`;

        // Helper to append generic values
        const append = (key: string, val: any) => {
            if (val !== null && val !== undefined) {
                formData.append(key, String(val));
            }
        };

        append('HouseListingId', data.HouseListingId);
        append('FullName', data.FullName);
        append('OrganizationName', data.OrganizationName);
        append('Email', data.Email);
        append('PhoneNumber', data.PhoneNumber);

        // Dates & Times
        const formatDate = (date: any) => {
            if (!date) return '';
            const d = new Date(date);
            // Returns YYYY-MM-DD
            return d.toISOString().split('T')[0];
        };

        // If time is coming as HH:mm string from input type="time", it's fine. 
        // If it's a full Date object, we might need to extract time. 
        // Assuming input type="time" gives user local time string 'HH:mm'.
        // API expects string($time), likely 'HH:mm:ss' or similar. 
        // Let's ensure we send something reasonable.
        const formatTime = (time: any) => {
            if (!time) return '';
            if (time.length === 5) return time + ':00'; // HH:mm -> HH:mm:ss
            return time;
        };

        if (data.PreferredContactDate) append('PreferredContactDate', formatDate(data.PreferredContactDate));
        if (data.PreferredContactTime) append('PreferredContactTime', formatTime(data.PreferredContactTime));

        if (data.PreferredVirtualTourDate) append('PreferredVirtualTourDate', formatDate(data.PreferredVirtualTourDate));
        if (data.PreferredVirtualTourTime) append('PreferredVirtualTourTime', formatTime(data.PreferredVirtualTourTime));

        if (data.PreferredInPersonTourDate) append('PreferredInPersonTourDate', formatDate(data.PreferredInPersonTourDate));
        if (data.PreferredInPersonTourTime) append('PreferredInPersonTourTime', formatTime(data.PreferredInPersonTourTime));

        // Enums
        append('AuthorizationType', data.AuthorizationType || 0);
        append('ListingAuthorizationDocument', data.ListingAuthorizationDocument || 0);

        if (data.AuthorizationValidationDate) append('AuthorizationValidationDate', data.AuthorizationValidationDate);

        append('SaveThisAuthorizationForFutureListings', data.SaveThisAuthorizationForFutureListings ? 'true' : 'false');

        // Open House Event (Extra fields from UI, mapping might happen in component but let's support them if API changes)
        // For now, API spec doesn't explicitly list OpenHouse fields in basic non-multipart section, assuming they might be part of extended Data or just ignored if not in spec. 
        // The user provided spec has "Open House Event" in UI but not explicitly in the curl parameters list provided for /create/authoring unless implicit.
        // We will stick to the provided CURL parameters strictly for now.

        // Attachments
        if (data.Attachments && Array.isArray(data.Attachments)) {
            data.Attachments.forEach((file: any) => {
                if (file instanceof File) {
                    formData.append('Attachments', file);
                }
            });
        }

        return this.http.post(apiUrl, formData);
    }
    cancelHousingRequest(requestId: number | string): Observable<any> {
        return this.http.put(`${environment.apiBaseUrl}/housing/agent/request/${requestId}/cancel`, {});
    }
}
