import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class RolesGetterService extends BaseGetterService
{ 
	// protected readonly papiRolesFields: string[] = ["InternalID", "CreationDateTime", "ModificationDateTime", "Name", "ParentInternalID"];

	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}

	public getResourceName(): string 
	{
		return 'roles';
	}
	
	public async buildFixedFieldsArray(): Promise<string[]> 
	{
		const schemaFields = await this.getSchemeFields(this.getResourceName());

		// Remove "Hidden" from the array of requested fields
		// This is done since PAPI doesn't have a Hidden field for roles.
		schemaFields.splice(schemaFields.indexOf("Hidden"), 1 );

		return schemaFields;
	}

	public singleObjectFix(role: any): void
	{
		return;
	}
}
