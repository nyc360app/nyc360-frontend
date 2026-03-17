import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HousingSubmissionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/housing/create`;

    createRentingPost(data: any): Observable<any> {
        const formData = this.prepareRentingFormData(data);
        return this.http.post(`${this.apiUrl}/renting`, formData);
    }

    createSalePost(data: any): Observable<any> {
        const formData = this.prepareSaleFormData(data);
        return this.http.post(`${this.apiUrl}/sale`, formData);
    }

    updateRentingPost(id: number, data: any): Observable<any> {
        const formData = this.prepareRentingFormData(data, true);
        return this.http.put(`${environment.apiBaseUrl}/housing/${id}/edit/rent`, formData);
    }

    updateSalePost(id: number, data: any): Observable<any> {
        const formData = this.prepareSaleFormData(data, true);
        return this.http.put(`${environment.apiBaseUrl}/housing/${id}/edit/sale`, formData);
    }

    private prepareRentingFormData(data: any, isUpdate = false): FormData {
        const formData = new FormData();
        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

        // Enums & Integers
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

        // Strings
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

        // Dates
        if (data.MoveInDate) formData.append('MoveInDate', new Date(data.MoveInDate).toISOString());
        if (data.MoveOutDate) formData.append('MoveOutDate', new Date(data.MoveOutDate).toISOString());

        // Booleans
        const boolFields = [
            'ShortTermStayAllowed', 'ShortStayEligiblity', 'Furnished',
            'AcceptsHousingVouchers', 'FamilyAndKidsFriendly', 'PetsFriendly',
            'AccessibilityFriendly', 'SmokingAllowed', 'IsPublished',
            'AddDirectApplyLink', 'AllowColisterEditing'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

        // Arrays
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

        if (isUpdate) {
            appendArrayOrZero('CoListing', data.CoListing);
            appendArrayOrZero('DeletedPhotoIds', data.DeletedPhotoIds);
            if (data.NewPhotos && Array.isArray(data.NewPhotos)) {
                data.NewPhotos.forEach((file: any) => {
                    if (file instanceof File) formData.append('NewPhotos', file);
                });
            }
        } else {
            if (data.CoListing) {
                data.CoListing.forEach((id: any) => {
                    if (id !== null && id !== undefined && id !== '') formData.append('CoListing', String(id));
                });
            }
            if (data.Photos && Array.isArray(data.Photos)) {
                data.Photos.forEach((file: any) => {
                    if (file instanceof File) formData.append('Photos', file);
                });
            }
        }

        return formData;
    }

    private prepareSaleFormData(data: any, isUpdate = false): FormData {
        const formData = new FormData();
        const appendInt = (key: string, val: any) => {
            const num = parseInt(val, 10);
            formData.append(key, isNaN(num) ? '0' : String(num));
        };
        const appendString = (key: string, val: any) => {
            formData.append(key, (val !== null && val !== undefined) ? String(val) : '');
        };

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

        appendString('Borough', data.Borough);
        appendString('ZipCode', data.ZipCode);
        appendString('Neighborhood', data.Neighborhood);
        appendString('FullAddress', data.FullAddress);
        appendString('UnitNumber', data.UnitNumber);
        appendString('GoogleMap', data.GoogleMap);
        appendString('Description', data.Description);
        appendString('DirectApplyLink', data.DirectApplyLink);

        if (data.OpeningDate) formData.append('OpeningDate', new Date(data.OpeningDate).toISOString());

        const boolFields = [
            'Furnished', 'AcceptsHousingVouchers', 'FamilyAndKidsFriendly',
            'PetsFriendly', 'AccessibilityFriendly', 'SmokingAllowed',
            'AddDirectApplyLink', 'AllowColisterEditing', 'IsPublished'
        ];
        boolFields.forEach(field => {
            formData.append(field, data[field] ? 'true' : 'false');
        });

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

        if (isUpdate) {
            appendArrayOrZero('CoListing', data.CoListing);
            appendArrayOrZero('DeletedPhotoIds', data.DeletedPhotoIds);
            if (data.NewPhotos && Array.isArray(data.NewPhotos)) {
                data.NewPhotos.forEach((file: any) => {
                    if (file instanceof File) formData.append('NewPhotos', file);
                });
            }
        } else {
            if (data.CoListing) {
                data.CoListing.forEach((id: any) => {
                    if (id !== null && id !== undefined && id !== '') formData.append('CoListing', String(id));
                });
            }
            if (data.Photos && Array.isArray(data.Photos)) {
                data.Photos.forEach((file: any) => {
                    if (file instanceof File) formData.append('Photos', file);
                });
            }
        }

        return formData;
    }
}
