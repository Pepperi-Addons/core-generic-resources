/* eslint-disable @typescript-eslint/no-empty-function */
import { PapiGetterService } from "./papiGetter.service";

export class PapiAccountBuyersService extends PapiGetterService
{ 

	getResourceName(): string
	{
		return 'account_buyers';
	}

	async buildFixedFieldsString(): Promise<string> 
	{
		const fields = await this.getSchemeFields('account_users');
		return fields.join(',');
	}

	additionalFix(object): void
	{}
}
