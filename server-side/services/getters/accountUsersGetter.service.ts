/* eslint-disable @typescript-eslint/no-empty-function */
import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class AccountUsersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}
	
	getResourceName(): string
	{
		return 'account_users';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		const fields = await this.getSchemeFields('account_users');
		return fields.join(',');
	}

	additionalFix(object): void
	{}
}
