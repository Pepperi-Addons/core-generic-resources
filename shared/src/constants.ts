export type PapiBatchResponse = [
    { InternalID: number, UUID: string, ExternalID: string, Status: 'Update' | 'Insert' | 'Ignore' | 'Error', Message: string, URI: string }
];

export const RESOURCE_TYPES = ['accounts', 'items', 'users', 'catalogs', 'account_users', 'contacts', "employees"];
export const READONLY_RESOURCES = ['users', 'account_users'];
export const CORE_ADDON_UUID = '00000000-0000-0000-0000-00000000c07e';
export const CORE_BASE_URL = `/addons/api/${CORE_ADDON_UUID}/data_source_api`;

export const NUMBER_OF_USERS_ON_IMPORT_REQUEST = 5;

export type DimxObject = {DIMXObjects: {Status: string, Object?: any, Details?: string}[]}
