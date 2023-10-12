import { PageNumberBuilder as PageNumberEtl } from '@pepperi-addons/etl-sdk';
import { RolesGetterService } from '../getters/rolesGetter.service';
import { IBuildServiceParams } from './iBuildServiceParams';


export const BuildRolesParams: IBuildServiceParams =
{
	baseGetterService: RolesGetterService,
	adalTableName: 'roles',
	etlService: PageNumberEtl
}
