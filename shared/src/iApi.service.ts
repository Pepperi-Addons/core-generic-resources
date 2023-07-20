import { ISearchService } from "./iSearch.service";

export interface IApiService extends ISearchService
{
    createResource(resourceName: string, body: any): Promise<any>;

    getResources(resourceName: string, query: string, whereClause: string | undefined): Promise<Array<any>>;

    getResourceByKey(resourceName: string, key: string, whereClause: undefined): Promise<any>;

    getResourceByUniqueField(resourceName: string, uniqueFieldId: string, value: string, whereClause: undefined): Promise<any>;

    searchResource(resourceName: string, body: any): Promise<{Objects: Array<any>, Count?: number}>;

	batchUpsert(resourceName: string, objects: Array<any>): Promise<Array<any>>;
}
