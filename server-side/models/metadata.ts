declare type ActionType = 'insert' | 'update' | 'remove';

export interface User {
    Key: string,
    FirstName: string,
    LastName: string,
    Name: string,
    Email: string,
    ExternalID: string,
    Mobile: string,
	Phone: string,
    Hidden: boolean
}

export interface AccountUser {
    Key: string,
    Account: any,
    User: any,
    Hidden: boolean
}

export interface PnsParams {
    AddonRelativeURL: string,
    Name: string,
    Action: ActionType,
    Resource: string,
	ModifiedFields?: string[],
	AddonUUID?: string
}

