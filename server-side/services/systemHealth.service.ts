import { Client } from '@pepperi-addons/debug-server/dist';
import { PapiClient } from '@pepperi-addons/papi-sdk'
import { Helper } from 'core-resources-shared';
import jwtDecode from 'jwt-decode';

class SystemHealthService 
{

	systemHealthBaseUrl = '/system_health/notifications'
	private papiClient: PapiClient;

	constructor(private client: Client) 
	{
		this.papiClient = Helper.getPapiClient(client);
	}

	public async sendUserWebhookNotification(name: string, description: string, status: string, message: string,sendNotification:string,userWebhook:string) 
	{
		console.log(
			`SystemHealthService: Trying to send health status: ${name}, ${description}, ${status}, ${message}`,
		);
		try 
		{
			await this.papiClient.post(this.systemHealthBaseUrl, {
				Name: name,
				Description: description,
				Status: status,
				Message: message,
				SendNotification: sendNotification,
				UserWebhook: userWebhook
			});
		}
		catch (ex) 
		{
			console.error(`Error in sendHealthStatus: ${(ex as { message: string }).message}`);
			throw ex;
		}
	}

	public async sendAlertToCoreResourcesAlertsChannel(description: string, errorMessage: string): Promise<void> 
	{
		const jwt = <any>jwtDecode(this.client.OAuthAccessToken);
		const isAsync: boolean = this.client.isAsync!();
		const enviroment = jwt["pepperi.datacenter"];
		const distributorUUID = jwt["pepperi.distributoruuid"];
		const distributor: any = await this.papiClient.get("/distributor");

		const name = `<b>${enviroment.toUpperCase()}</b> - Core Resources Error `;
		const message = `<b>Distributor:</b> ${distributor["InternalID"]} - ${distributor["Name"]}<br><b>DistUUID:</b> ${distributorUUID}<br><b>ActionUUID:</b> ${this.papiClient["options"]["actionUUID"]}<br><b>IsAsync operation: </b>${isAsync}
            <br><b style="color:red">ERROR!</b>
			<br>${errorMessage}<br>
			<br>`;

		const kms = await this.papiClient.get("/kms/parameters/core_resources_alertsUrl");

		await this.sendUserWebhookNotification(name, description, 'ERROR', message, "Always", kms.Value);
	}
}

export default SystemHealthService;
