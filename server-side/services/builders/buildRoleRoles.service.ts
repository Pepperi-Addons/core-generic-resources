import { PageNumberBuilder as PageNumberEtl } from '@pepperi-addons/modelsdk';
import { RolesGetterService } from '../getters/rolesGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildRoleRolesParams: IBuildServiceParams =
{
	baseGetterService: RolesGetterService,
	adalTableName: 'role_roles',
	etlService: PageNumberEtl

}
