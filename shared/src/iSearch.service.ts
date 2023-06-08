export interface ISearchService
{
    searchResource(resourceName: string, body: any): Promise<{Objects: Array<any>, Count?: number}>;
}
