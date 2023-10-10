import { PapiClient } from '@pepperi-addons/papi-sdk'

class SystemHealthService 
{

	systemHealthBaseUrl = '/system_health/notifications'

	constructor(private papiClient: PapiClient) 
	{
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
}

export default SystemHealthService;
