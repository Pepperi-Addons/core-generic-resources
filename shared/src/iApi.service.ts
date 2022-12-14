export interface IApiService
{
    createResource(resourceName: string, body: any): {};

    getResources(resourceName: string, query: string, whereClause: string | undefined): {};

    getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any>;

    getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): {};

    searchResource(resourceName: string, body: void): {};
    
    isAccountTypeDefinitionFilteringRequired(): boolean;
    
    getAccountTypeDefinitionID(): Promise<any>;
}
