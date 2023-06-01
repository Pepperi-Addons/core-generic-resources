import { PapiRolesGetterService } from '../getters/papiRolesGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildRoleRolesParams: IBuildServiceParams =
{
	papiGetterService: PapiRolesGetterService,
	adalTableName: 'role_roles',
	whereClause: ""
}
