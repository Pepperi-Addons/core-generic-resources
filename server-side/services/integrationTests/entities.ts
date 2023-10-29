export interface TestBody
{
    /**
     * Input objects to be used in the test, by resource name.
     * These objects will be used instead of the real objects from PAPI.
     */
    TestInputObjects?: { [key: string]: any[] }
    IsTest?: boolean;
    [key: string]: any;
}
