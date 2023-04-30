/* eslint-disable @typescript-eslint/no-empty-function */
import { PapiGetterService } from "./papiGetter.service";

export class PapiAccountUsersGetterService extends PapiGetterService
{ 

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
