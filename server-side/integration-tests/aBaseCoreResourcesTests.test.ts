import { BaseTest } from "@pepperi-addons/addon-testing-framework";
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { CoreResourcesTestsService } from "./services/coreResources.service";

export abstract class ABaseCoreResourcesTests extends BaseTest
{
	private _coreResourcesTestsService: CoreResourcesTestsService | undefined;
	private _papiClient: PapiClient | undefined;
	private _asyncPapiClient: PapiClient | undefined;

	protected readonly ASYNC_JOB_AWAIT: number = 20;
	

	protected get coreResourcesTestsService(): CoreResourcesTestsService
	{
		if(!this._coreResourcesTestsService)
		{
			this._coreResourcesTestsService = new CoreResourcesTestsService(this.papiClient, this.asyncPapiClient);
		}

		return this._coreResourcesTestsService;
	}

	protected get papiClient(): PapiClient
	{
		if(!this._papiClient)
		{
			this._papiClient = new PapiClient({
				baseURL: this.container.client.BaseURL,
				token: this.container.client.OAuthAccessToken,
				addonUUID: this.container.client.AddonUUID,
				addonSecretKey: this.container.client.AddonSecretKey,
				actionUUID: this.container.client.ActionUUID,
			});
		}

		return this._papiClient;
	}

	/** papiClient with no actionUUID, used for internal async calls
	 * to prevent overwriting the async resultObject
	 */
	protected get asyncPapiClient(): PapiClient
	{
		if(!this._asyncPapiClient)
		{
			this._asyncPapiClient = new PapiClient({
				baseURL: this.container.client.BaseURL,
				token: this.container.client.OAuthAccessToken,
				addonUUID: this.container.client.AddonUUID,
				addonSecretKey: this.container.client.AddonSecretKey,
			});
		}

		return this._asyncPapiClient;
	}


	constructor()
	{
		super();
	}
}
