import { PageKeyBuilder as PageKeyEtl } from '@pepperi-addons/etl-sdk';
import { RoleRolesGetterService } from '../getters/roleRolesGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildRoleRolesParams: IBuildServiceParams =
{
	baseGetterService: RoleRolesGetterService,
	adalTableName: 'role_roles',
	etlService: PageKeyEtl
}
