import { AddonDataScheme, SchemeFieldType } from "@pepperi-addons/papi-sdk";

export const TSA_CREATION_SUBSCRIPTION_NAME = 'core-resources-TSA-creation';
export const TSA_MODIFICATION_SUBSCRIPTION_NAME = 'core-resources-TSA-modification';

export const OwnerObjectTypeIDToResourceTypeMap: Map<number, string> = new Map([
    [35, 'accounts'],
    [7, 'items'],
    [54, 'catalogs'],
    [33, 'contacts'],
    [23, 'employees'],
    [116, 'profiles']
    ]);

/**
 * Returns the ADAL field type for a given populatable object type
 * If the populatable object type is not defined, returns 'String' as a default.
 * @param populatableObjectType 
 * @returns a string representing the ADAL field type
 */
export function getAdalFieldTypeFromPopulatableObjectType(populatableObjectType: number): SchemeFieldType
{
    switch(populatableObjectType)
    {
        case 1:
        case 7:
        case 8:
        case 9:
        case 10:
            return 'String';
        case 2:
        case 3:
            return 'DateTime';
        case 4:
            return 'Integer';
        case 5:
            return 'Double';
        case 6: 
            return 'Bool';
        default:
            return 'String';
    }
}

export type TSA = { 
    UUID: string;
    Name: string;
    OwnerObjectTypeID: number;
    PopulatableObjectType: number;
};

// Pick the Name and Fields properties from the AddonDataScheme interface, and make them required (non optional)
export type SchemaNameAndFields = Required<Pick<AddonDataScheme, 'Name' | 'Fields'>>;
