import { AddonData, PapiClient, SearchData } from '@pepperi-addons/papi-sdk';
import { ISearchService } from 'core-resources-shared';
import { resourceNameToSchemaMap } from '../../resourcesSchemas';

export abstract class BaseGetterService 
{
	protected _requestedFields: string[] | undefined;

	constructor(protected papiClient: PapiClient, protected iSearchService: ISearchService , 
				private whereClause: string = "", private isPageKeySearch: boolean = false)
	{
	}

	// this function makes sure the fields string is built only once
	protected async getRequestedFieldsArray(): Promise<string[]>
	{
		if(!this._requestedFields)
		{
			this._requestedFields = await this.buildFixedFieldsArray();
		}
		return this._requestedFields;
	}

    abstract getResourceName(): string; // search is performed on the given resource
    abstract buildFixedFieldsArray(): Promise<string[]>; 
    abstract singleObjectFix(object): void;

    protected async getObjects(body: any, additionalFieldsArray: string[] = []): Promise<SearchData<AddonData>> 
    {
    	console.log("GETTING OBJECTS");
    	console.log(body);
    	const fieldsArray = await this.getRequestedFieldsArray();
    	body["Fields"] = fieldsArray.concat(additionalFieldsArray);
    	body["IncludeDeleted"] = true;
    	body["OrderBy"] = "CreationDateTime";
    	const searchResponse = await this.iSearchService.searchResource(this.getResourceName(), body);
    	console.log("FINISHED GETTING OBJECTS");
    	return searchResponse;
    }

    public async getObjectsByPage(page: number | string, pageSize: number, additionalFields?: string[]): Promise<SearchData<AddonData>>
    {
    	const body = {
    		Where: this.whereClause,
    		PageSize: pageSize,
    		...(this.isPageKeySearch ? {PageKey: page} : {Page: page})
    	}
    	return await this.getObjects(body, additionalFields);
    }

    public async getObjectsByKeys(Keys: string[], additionalFields?: string[]): Promise<SearchData<AddonData>>
    {
    	const body = { KeyList: Keys };
    	return await this.getObjects(body, additionalFields);
    }

    protected async getSchemeFields(schemeName: string): Promise<string[]>
    {
    	const scheme = resourceNameToSchemaMap[schemeName];

    	const fields = Object.keys(scheme.Fields as any);
    	fields.push('Hidden');
    	fields.push('Key');
    	return fields;
    }

    // this function allows us to add common fix logic if needed
    public fixObjects(papiObjects: any[]): any[]
    {
    	console.log("FIXING OBJECTS");
    	for (const papiObject of papiObjects)
    	{
    		this.singleObjectFix(papiObject);
    	}
    	return papiObjects;
    }
}
