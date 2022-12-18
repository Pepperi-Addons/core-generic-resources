export interface ICoreService {
    getResourceByUniqueField(): Promise<any>;

    createResource(): Promise<any>;

    getResources(): Promise<Array<any>>;

    getResourceByKey(): Promise<any>;

    search(): Promise<{Objects: Array<any>, Count?: number}>;
}