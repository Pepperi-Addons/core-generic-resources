import { PapiUsersGetterService } from '../getters/papiUsersGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildUsersParams: IBuildServiceParams =
{
	papiGetterService: PapiUsersGetterService,
	adalTableName: 'users',
	whereClause: ""
}
