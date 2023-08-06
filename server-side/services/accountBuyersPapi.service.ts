import { PapiService } from 'core-resources-shared';

export class AccountBuyersPapiService extends PapiService
{
	override createResource(resourceName: string, body: any) : Promise<any>
	{
		throw new Error(`Creation of '${resourceName}' is not supported`);
	}
}

