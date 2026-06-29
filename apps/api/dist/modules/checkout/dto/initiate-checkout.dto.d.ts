import { PayerContactDto } from './payer-contact.dto';
export declare class DeliveryAddressDto {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
    locality?: string;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
}
export declare class InitiateCheckoutDto {
    deliveryAddress: DeliveryAddressDto;
    buyerNote?: string;
    walletAmountToUse?: number;
    rewardPointsToRedeem?: number;
    referralCode?: string;
    deviceFingerprint?: string;
    corporatePurchaseRequestId?: string;
    payerContact?: PayerContactDto;
}
