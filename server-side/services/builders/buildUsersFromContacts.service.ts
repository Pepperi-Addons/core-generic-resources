import { PapiContactsGetterService } from '../getters/papiContactsGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersFromContactsParams: IBuildServiceParams =
{
	papiGetterService: PapiContactsGetterService,
	adalTableName: 'users',
	whereClause: ""
}
