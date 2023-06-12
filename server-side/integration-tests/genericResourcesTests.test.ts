import { ABaseCoreResourcesTests } from "./aBaseCoreResourcesTests.test";
import { GenericResourceTestInput } from "./entities";
import { CoreResourcesService } from "./services/coreResources.service";
import { genericResourcesTestsData as GenericResourcesTestsData } from "./testsData/genericResources";

export class GenericResourcesTests extends ABaseCoreResourcesTests 
{

	title = 'Generic Resources Tests';

	tests(describe: (suiteTitle: string, func: () => void) => void,
		it: (name: string, fn: Mocha.Func) => void,
		expect: Chai.ExpectStatic,
		/*after: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        afterEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        before: ((fn: Mocha.Func | Mocha.AsyncFunc) => void),
        beforeEach: ((fn: Mocha.Func | Mocha.AsyncFunc) => void)*/): void 
	{
		describe(this.title, async () => 
		{
            for (const testData of GenericResourcesTestsData)
            {
                await this.genericResourceTests(it, expect, this.coreResourcesService, testData);
            }
		})
	}

	protected async genericResourceTests(it: any, expect: Chai.ExpectStatic, coreResourcesService: CoreResourcesService, testData: GenericResourceTestInput) 
	{

		const schemeFields = await coreResourcesService.getAdalSchemeFieldsNames(testData.ResourceName);

		const objects = await coreResourcesService.getGenericResourceObjects(testData.ResourceName);
		expect(objects).to.be.an('array').with.lengthOf.above(0);

		it('Get by key test', async () => 
		{

			expect(objects[0]).to.have.property('Key').that.is.a('string').and.is.not.empty;
			const requestedObject = await coreResourcesService.getGenericResourceByKey(testData.ResourceName, objects[0].Key!);
			for (const field of schemeFields) 
			{
				expect(requestedObject).to.have.property(field).that.equals(objects[0][field]);
			}
			expect(await coreResourcesService.getGenericResourceByKey(testData.ResourceName, 'badKey')).to.throw('Not Found');
			const validKey = coreResourcesService.generateValidKey();
			expect(await coreResourcesService.getGenericResourceByKey(testData.ResourceName, validKey)).to.throw('Not Found');

		});

		it('Get by unique field test', async () => 
		{

			expect(objects[0]).to.have.property(testData.UniqueFieldID).that.is.not.empty;
			const requestedObject = await coreResourcesService.getGenericResourceByUniqueField(testData.ResourceName, testData.UniqueFieldID, objects[0][testData.UniqueFieldID]);
			for (const field of schemeFields) 
			{
				expect(requestedObject).to.have.property(field).that.equals(objects[0][field]);
			}
			expect(await coreResourcesService.getGenericResourceByUniqueField(testData.ResourceName, testData.UniqueFieldID, 'randomValue')).to.throw('not found');
			expect(await coreResourcesService.getGenericResourceByUniqueField(testData.ResourceName, testData.NonUniqueFieldID, 'randomValue')).to.throw('field_id is not unique');
		});

		it('Search test', async () => 
		{

			const searchBody = {};
			let requestedObjects = await coreResourcesService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Objects').that.is.an('array').and.is.not.empty;
			for (const obj of requestedObjects['Objects']) 
			{
				for (const field of schemeFields) 
				{
					expect(obj).to.have.property(field);
				}
			}

			// IncludeCount
			searchBody['IncludeCount'] = true;
			requestedObjects = await coreResourcesService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Count').that.equals(requestedObjects['Objects'].length);

			// Where
			searchBody['Where'] = `${testData.NonUniqueFieldID}='${objects[0][testData.NonUniqueFieldID]}'`;
			requestedObjects = await coreResourcesService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Objects').that.is.an('array').and.is.not.empty;
			for (const obj of requestedObjects['Objects']) 
			{
				expect(obj).to.have.property(testData.NonUniqueFieldID);
				expect(obj[testData.NonUniqueFieldID]).to.equal(objects[0][testData.NonUniqueFieldID]);
			}

			// Unique field
			delete searchBody['Where'];
			searchBody['UniqueFieldList'] = [objects[0][testData.UniqueFieldID], objects[1][testData.UniqueFieldID]];
			searchBody['UniqueFieldID'] = testData.UniqueFieldID;
			requestedObjects = await coreResourcesService.searchGenericResource(testData.ResourceName, searchBody);
			expect(requestedObjects).to.have.property('Objects').that.is.an('array').with.lengthOf(2);
		});
	}
}
