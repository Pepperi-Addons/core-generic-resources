import { AddonData } from "@pepperi-addons/papi-sdk";

import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { GenericResourceTestInput } from "./entities";
import { genericResourcesTestsData as GenericResourcesTestsData } from "./testsData/genericResources";

export class GenericResourcesTests extends ABaseCoreResourcesTests 
{

	title = 'Generic Resources Tests';

	protected _schemaFields: string[] | undefined;
	protected _genericResourceObjects: AddonData[] | undefined;
	protected _testData: GenericResourceTestInput | undefined;

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic
	): void 
	{
		describe(this.title, async () => 
		{
			for (const testData of GenericResourcesTestsData)
			{
				await this.genericResourceTests(it, expect, testData);
			}
		})
	}

	protected async genericResourceTests(it: any, expect: Chai.ExpectStatic , testData: GenericResourceTestInput) 
	{
		it('Get by key test', async () => 
		{
			const {SchemaFields, Objects} = await this.getCachedSchemaInfo(testData);
			expect(Objects).to.be.an('array').with.lengthOf.above(0);

			expect(Objects[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
			const requestedObject = await this.coreResourcesTestsService.getGenericResourceByKey(testData.ResourceName, Objects[0].Key!);
			for (const field of SchemaFields) 
			{
				expect(requestedObject).to.have.property(field).that.equals(Objects[0][field]);
			}
			await expect(this.coreResourcesTestsService.getGenericResourceByKey(testData.ResourceName, 'badKey')).to.be.rejectedWith(/Object ID does not exist|is not vaild UUID/i);
			const validKey = this.coreResourcesTestsService.generateValidKey();
			await expect(this.coreResourcesTestsService.getGenericResourceByKey(testData.ResourceName, validKey)).to.be.rejectedWith(/Object ID does not exist|not found/i);

		});

		it('Get by unique field test', async () => 
		{
			const {SchemaFields, Objects} = await this.getCachedSchemaInfo(testData);
			expect(Objects).to.be.an('array').with.lengthOf.above(0);
			const objectsWithUniqueValue = Objects.filter(obj => obj[testData.UniqueFieldID]);
			if(objectsWithUniqueValue.length > 0)
			{
				expect(objectsWithUniqueValue[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
				expect(objectsWithUniqueValue[0]).to.have.property(testData.UniqueFieldID);
				const requestedObject = await this.coreResourcesTestsService.getGenericResourceByUniqueField(testData.ResourceName, testData.UniqueFieldID, objectsWithUniqueValue[0][testData.UniqueFieldID]);
				for (const field of SchemaFields)
				{
					expect(requestedObject).to.have.property(field).that.equals(Objects[0][field]);
				}
				await expect(this.coreResourcesTestsService.getGenericResourceByUniqueField(testData.ResourceName, testData.UniqueFieldID, '42')).to.be.rejectedWith(/Object ID does not exist|not found/i);
				await expect(this.coreResourcesTestsService.getGenericResourceByUniqueField(testData.ResourceName, testData.NonUniqueFieldID, 'randomValue')).to.be.rejectedWith(/The field_id query parameter is not valid|field_id is not unique/i);
			}
		});

		it('Search test', async () => 
		{

			const {SchemaFields, Objects} = await this.getCachedSchemaInfo(testData);
			expect(Objects).to.be.an('array').with.lengthOf.above(0);

			const searchBody = {};
			let requestedObjects = await this.coreResourcesTestsService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Objects').that.is.an('array').and.is.not.empty;
			for (const obj of requestedObjects['Objects']) 
			{
				for (const field of SchemaFields) 
				{
					expect(obj).to.have.property(field);
				}
			}

			// Where
			const nonNullNonUniqueField = Objects.find(obj => obj[testData.NonUniqueFieldID] !== null && obj[testData.NonUniqueFieldID] !== undefined);
			if(nonNullNonUniqueField)
			{
				searchBody['Where'] = `${testData.NonUniqueFieldID}='${nonNullNonUniqueField[testData.NonUniqueFieldID]}'`;
				requestedObjects = await this.coreResourcesTestsService.searchGenericResource(testData.ResourceName, searchBody);
				expect(requestedObjects).to.have.property('Objects').that.is.an('array').and.is.not.empty;
				for (const obj of requestedObjects['Objects']) 
				{
					expect(obj).to.have.property(testData.NonUniqueFieldID);
					expect(obj[testData.NonUniqueFieldID]).to.equal(nonNullNonUniqueField[testData.NonUniqueFieldID]);
				}
			}

			// Unique field
			delete searchBody['Where'];
			const numberOfWantedElements = 2;
			
			// Filter at most 2 elements from the Objects array
			const filteredObjects = Objects.filter(obj => obj[testData.UniqueFieldID] !== null && obj[testData.UniqueFieldID] !== undefined).slice(0, numberOfWantedElements);

			searchBody['UniqueFieldList'] = filteredObjects.map(obj => obj[testData.UniqueFieldID]);
			searchBody['UniqueFieldID'] = testData.UniqueFieldID;
			requestedObjects = await this.coreResourcesTestsService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Objects').that.is.an('array').with.lengthOf(filteredObjects.length);
		});
	}

	protected async getCachedSchemaInfo(testData: GenericResourceTestInput): Promise<{ SchemaFields: string[], Objects: AddonData[] }>
	{
		if(!this._testData || JSON.stringify(testData) !== JSON.stringify(this._testData))
		{
			this._testData = testData;
			this._schemaFields = await this.coreResourcesTestsService.getAdalSchemeFieldsNames(testData.ResourceName);
			this._genericResourceObjects = await this.coreResourcesTestsService.getGenericResourceObjects(testData.ResourceName);
		}

		return {
			Objects: this._genericResourceObjects!,
			SchemaFields: this._schemaFields!
		}
	}
}
