import { FindOptions } from "@pepperi-addons/papi-sdk";
import { RoleRole } from "../services/getters/rolesGetter.service";
import { TestBody } from "../services/integrationTests/entities";
import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { RoleRolesTestData } from "./testsData/roleRoles";

export class CoreResourcesPnsTests extends ABaseCoreResourcesTests
{
	title = 'Core Resources PNS Tests';

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic,
		/*after: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        afterEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        before: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        beforeEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void)*/): void 
	{
		describe('users, contacts, account_users PNS tests', () => 
		{
			let createdContacts: any[] = [];
			let createdUsers: any[] = [];
			let createdAccountUsers: any[] = [];
			it('Create papi contacts, PNS should upsert buyers only to adal users table', async () => 
			{
				const testAccount = await this.coreResourcesTestsService.createTestAccount();
				const initialAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users');
				const initialNonHiddenAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users',false);
				const numberOfContacts = 50;
				createdContacts = await this.coreResourcesTestsService.createContactsForTest(numberOfContacts, testAccount);
				// wait for PNS to finish
				await this.coreResourcesTestsService.waitForAsyncJob(20);
				let currentAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users');
				// contacts should not be upserted to adal users table
				expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length);
				await this.coreResourcesTestsService.connectContacts(createdContacts.slice(0, numberOfContacts/2));
				// wait for PNS to finish
				await this.coreResourcesTestsService.waitForAsyncJob(20);
				currentAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users');
				expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length + numberOfContacts/2);
				await this.coreResourcesTestsService.disconnectBuyers(createdContacts.slice(0, numberOfContacts/5));
				// wait for PNS to finish
				await this.coreResourcesTestsService.waitForAsyncJob(20);
				currentAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users', false);
				const diff = numberOfContacts/2 - numberOfContacts/5;
				expect(currentAdalUsersList.length).to.equal(initialNonHiddenAdalUsersList.length + diff); // 50 - 20 = 30
				//expected properties
				expect(currentAdalUsersList[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(currentAdalUsersList[0]).to.have.property('Email').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('FirstName').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('LastName').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('Name').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('ExternalID').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('Mobile').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('Phone').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('Profile').that.is.a('string');
				expect(currentAdalUsersList[0]).to.have.property('UserType').that.is.equal('Buyer');
	
				await this.coreResourcesTestsService.hideCreatedPapiObjects('contacts', createdContacts);
			});
	
			it('Create papi users, then account_users. PNS should upsert them to adal tables', async () => 
			{
				const testAccount = await this.coreResourcesTestsService.createTestAccount();
				const initialAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users');
				const numberOfUsers = 10;
				createdUsers = await this.coreResourcesTestsService.createPapiUsers(numberOfUsers);
				// wait for PNS to finish
				await this.coreResourcesTestsService.waitForAsyncJob(20);
				const currentAdalUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('users');
				expect(currentAdalUsersList.length).to.equal(initialAdalUsersList.length + numberOfUsers);
	
				// find a new user that was added to adal users table
				const newUserUUID = createdUsers[0].UUID;
				const newUser = currentAdalUsersList.find((user: any) => user.Key === newUserUUID);
	
				//expected properties
				expect(newUser).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(newUser).to.have.property('Email').that.is.a('string');
				expect(newUser).to.have.property('FirstName').that.is.a('string');
				expect(newUser).to.have.property('LastName').that.is.a('string');
				expect(newUser).to.have.property('UserType').that.is.equal('Employee');
	
				const initialAdalAccountUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('account_users');
				createdAccountUsers = await this.coreResourcesTestsService.createPapiAccountUsers(createdUsers, testAccount);
				// wait for PNS to finish
				await this.coreResourcesTestsService.waitForAsyncJob(20);
				const currentAdalAccountUsersList = await this.coreResourcesTestsService.getAllGenericResourceObjects('account_users');
				expect(currentAdalAccountUsersList.length).to.equal(initialAdalAccountUsersList.length + numberOfUsers);
	
				// find a new account user relation that was added to adal account users table
				const newAccountUserUUID = createdAccountUsers[0].UUID;
				const newAccountUser = currentAdalAccountUsersList.find((accountUser: any) => accountUser.Key === newAccountUserUUID);
	
				//expected properties
				expect(newAccountUser).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(newAccountUser).to.have.property('Account').that.is.a('string').that.is.equal(testAccount.UUID);
				expect(newAccountUser).to.have.property('User').that.is.a('string').and.is.not.empty;
			});
	
			it('Hide created objects', async () => 
			{
				await this.coreResourcesTestsService.hideCreatedPapiObjects('users', createdUsers);
				await this.coreResourcesTestsService.hideCreatedPapiObjects('account_users', createdAccountUsers);
			});
		});
	}
}
