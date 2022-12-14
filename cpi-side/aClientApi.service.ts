import { IApiService } from "core-resources-shared";

export default abstract class AClientApiService implements IApiService
{
    abstract createResource(resourceName: string, body: any);
    abstract getResources(resourceName: string, query: string, whereClause: string | undefined);
    abstract getResourceByKey(resourceName: string, key: string, whereClause: undefined);
    abstract getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined);
    abstract searchResource(resourceName: string, body: void);
    abstract isAccountTypeDefinitionFilteringRequired(): boolean
    abstract getAccountTypeDefinitionID();
}
