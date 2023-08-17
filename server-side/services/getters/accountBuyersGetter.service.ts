import { PapiService } from "core-resources-shared";
import { BaseGetterService } from "./baseGetter.service";
import { PapiClient } from "@pepperi-addons/papi-sdk";

export class AccountBuyersGetterService extends BaseGetterService
{ 
	constructor(papiClient: PapiClient)
	{
		super(papiClient, new PapiService(papiClient));
	}
	
	getResourceName(): string
	{
		return 'account_buyers';
	}

	async buildFixedFieldsArray(): Promise<string[]> 
	{
		const fields = await this.getSchemeFields('account_users');
		return fields;
	}

	singleObjectFix(object): void
	{
		return;
	}
}
