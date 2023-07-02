import { AddonData, SearchData } from "@pepperi-addons/papi-sdk";

export interface ISearchService
{
    searchResource(resourceName: string, body: any): Promise<SearchData<AddonData>>;
}
