export interface User {
    Key: string,
    FirstName: string,
    LastName: string,
    Name: string,
    Email: string,
    InternalID: string,
    ExternalID: string,
    Mobile: string,
    Hidden: boolean
}

export interface AccountUser {
    Key: string,
    Account: any,
    User: any,
    InternalID: string,
    Hidden: boolean
}
