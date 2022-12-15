import { IApiService } from "./iApi.service";

export interface IAccountsApiService extends IApiService
{
    /**
     * Concat a filtering where clause to return only wanted accounts
     * @param whereClause The query to which to add the where clause
     */
    concatFilteringWhereClause(whereClause: string) : Promise<string>;

    /**
     * Validate that the returned account fits the validation criteria
     * @param resource the resource to validate
     */
    validateResourceBeforeReturn(resource: any): Promise<void>;
}
