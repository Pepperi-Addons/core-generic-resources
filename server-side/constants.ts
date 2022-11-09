export type PapiBatchResponse = [
    { InternalID: number, UUID: string, ExternalID: string, Status: 'Update' | 'Insert' | 'Ignore' | 'Error', Message: string, URI: string }
];

export const RESOURCE_TYPES = ['accounts', 'items', 'users', 'catalogs', 'account_users', 'contacts'];
export const CORE_BASE_URL = '/addons/api/00000000-0000-0000-0000-00000000c07e/data_source_api';

export const NUMBER_OF_USERS_ON_IMPORT_REQUEST = 5;
