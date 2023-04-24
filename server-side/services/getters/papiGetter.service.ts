/* eslint-disable indent */
import { PapiClient } from '@pepperi-addons/papi-sdk';

export abstract class PapiGetterService 
{

	protected papiClient: PapiClient;
	protected _requestedFields: string | undefined;
	protected resourceTypeFields: string[] = [];

	constructor(papiClient: PapiClient)
	{
		this.papiClient = papiClient;
	}

	// this function makes sure the fields string is built only once
	async getRequestedFieldsString(): Promise<string>
	{
		if(!this._requestedFields)
		{
			this._requestedFields = await this.buildFixedFieldsString();
		}
		return this._requestedFields;
	}

    abstract getResourceName(): string; // search is performed on the given resource
    abstract buildFixedFieldsString(): Promise<string>; 
    abstract additionalFix(object): void;

    async getPapiObjects(body: any, additionalFieldsString?: string): Promise<any[]> 
    {
		console.log("GETTING PAPI OBJECTS");
    	console.log(body);
    	const fieldsString = await this.getRequestedFieldsString();
    	body["Fields"] = additionalFieldsString ? `${fieldsString},${additionalFieldsString}` : fieldsString;
		body["IncludeDeleted"] = true;
		body["OrderBy"] = "ModificationDateTime";
    	const papiObjects = await this.papiClient.post(`/${this.getResourceName()}/search`, body);
		console.log("FINISHED GETTING PAPI OBJECTS");
    	return papiObjects;
    }

    async getPapiObjectsByPage(whereClause: string, page: number, pageSize: number, additionalFields?: string): Promise<any[]>
    {
    	const body = {
    		PageSize: pageSize,
    		Page: page,
    		Where: whereClause
    	}
    	return await this.getPapiObjects(body, additionalFields);
    }

    async getPapiObjectsByUUIDs(UUIDs: string[], additionalFields?: string): Promise<any[]>
    {
    	const body = { UUIDList: UUIDs };
    	return await this.getPapiObjects(body, additionalFields);
    }

    async getSchemeFields(schemeName: string): Promise<string[]>
    {
    	const scheme = await this.papiClient.addons.data.schemes.name(schemeName).get();
    	// save fields of type "Resource" for later use
    	for(const fieldName in scheme.Fields)
    	{
    		if(scheme.Fields[fieldName].Type == "Resource") this.resourceTypeFields.push(fieldName);
    	}
    	let fields = Object.keys(scheme.Fields as any);
    	fields = fields.filter(f => f != 'Key');
    	fields.push('UUID');
		fields.push('Hidden');
    	return fields;
    }

    replaceUUIDWithKey(user): void
    {
    	user["Key"] = user["UUID"];
    	delete user["UUID"];
    }

    fixPapiObjects(papiObjects: any[]): any[] 
    {
		console.log("FIXING PAPI OBJECTS");
    	for(const objIndex in papiObjects)
    	{
    		this.replaceUUIDWithKey(papiObjects[objIndex]);
			this.additionalFix(papiObjects[objIndex]);
			// fix resource type fields
    		for(const field of this.resourceTypeFields)
    		{
    			// based on resource type field structure
    			papiObjects[objIndex][field] = papiObjects[objIndex][field]?.Data?.UUID;
    		}
    	}
    	return papiObjects;
    }

}
