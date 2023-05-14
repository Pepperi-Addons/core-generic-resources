import { v4 as createUUID } from 'uuid';

import { PapiGetterService } from "./papiGetter.service";


interface PapiRole
{
	InternalID: string;
	Name: string;
	ParentInternalID?: string;
}

interface TreeNode
{
	Role: string,
	ParentRole?: string
}

interface KeyedTreeNode extends TreeNode
{
	Key: string
}

export class PapiRolesGetterService extends PapiGetterService
{
	getResourceName(): string
	{
		return 'roles';
	}

	public async buildFixedFieldsString(): Promise<string>
	{
		return 'InternalID,ParentInternalID,Name';
	}

	additionalFix(object: any): void
	{}

	public override fixPapiObjects(nodes: PapiRole[]): KeyedTreeNode[]
	{
		const treeNodes: TreeNode[] = this.flattenTree(nodes);
		const keyedTreeNodes: KeyedTreeNode[] = this.addKeysToTreeNodes(treeNodes);
		return keyedTreeNodes;
	}

	/**
	 * Creates TreeNode objects such that each role has TreeNodes objects
	 * to represent its relation to any of its ancestors.
	 * @param nodes - the nodes as received from PAPI.
	 * @returns 
	 */
	protected flattenTree(nodes: PapiRole[]): TreeNode[]
	{
		// In order to execute DFS (to create all nodes in O(n)), 
		// first create a standard tree representation, where
		// each InternalID points to its direct children nodes.
		const internalIdToRole: Map<string, string> = this.createInternalIdToRoleMap(nodes);
		const treeNodes: TreeNode[] = nodes.map(node => 
		{
			return {
				Role: node.Name,
				ParentRole: node.ParentInternalID ? internalIdToRole.get(node.ParentInternalID) : undefined
			};
		});
		const treeRepresentation = this.createTree(treeNodes);

		// Since it is possible to have multiple roots (i.e. we have a forest, not a tree),
		// we have to run DFS for each root, so that each tree is traversed.
		const roots = treeNodes.filter(treeNode => !treeNode.ParentRole);
		const result: TreeNode[] = [];

		for (const root of roots)
		{
			this.iterativeDfs(root, treeRepresentation, result);
		}

		return result;
	}

	/**
    Creates a mapping between internal IDs and role names for a given list of PapiRole objects.
    @param {PapiRole[]} nodes - The list of PapiRole objects to create the mapping from.
    @returns A Map object where the keys are the internal IDs and the values are the role names.
    */
	protected createInternalIdToRoleMap(nodes: PapiRole[]): Map<string, string>
	{
		return nodes.reduce((resultMap, node) => 
		{
			return resultMap.set(node.InternalID, node.Name);
		}, new Map<string, string>);
	}

	/**
	Creates an inverse tree representation where each Role points to its direct children.
	@param nodes - The list of nodes representing the tree hierarchy.
	@returns A Map where each node's `Role` is the key, and its value is an array of its direct children.
	*/
	protected createTree(nodes: TreeNode[]): Map<string, TreeNode[]>
	{
		const inverseTree = new Map<string, TreeNode[]>();

		// group nodes by parent id
		const childrenByParent = nodes.reduce((roleToParent, node) => 
		{
			if (node.ParentRole)
			{
				const children = roleToParent.get(node.ParentRole) ?? [];
				children.push(node);
				roleToParent.set(node.ParentRole, children);
			}

			return roleToParent;
		}, new Map<string, TreeNode[]>());

		// build inverse tree
		nodes.forEach((node) => 
		{
			inverseTree.set(node.Role, childrenByParent.get(node.Role) ?? []);
		});

		return inverseTree;
	}

	/**
 * Performs a recursive depth-first search starting at the specified node.
 * The implementation also adds new nodes for each of the node's direct and indirect ancestors.
 *
 * @param {TreeNode} currentNode - The node to start the search from.
 * @param {Map<string, PapiRole[]>} inverseTree - The inverse tree representation where each node points to its direct children.
 * @param {PapiRole[]} result - The array to add visited nodes to.
 * @param {PapiRole[]} [ancestors=[]] - The array of ancestor nodes to pass down the search path.
 * 
 * @returns {void}
 */
	protected dfs(currentNode: TreeNode, inverseTree: Map<string, TreeNode[]>, result: TreeNode[], ancestors: TreeNode[] = []): void
	{
		result.push(...this.getAllAncestorsNodes(currentNode, ancestors));

		ancestors.push(currentNode);

		for (const child of inverseTree.get(currentNode.Role) ?? [])
		{
			this.dfs(child, inverseTree, result, ancestors);
		}

		// Before returning, remove the added currentNode from the ancestors array
		ancestors.pop();
	}

	protected iterativeDfs(currentNode: TreeNode, inverseTree: Map<string, TreeNode[]>, result: TreeNode[], ancestors: TreeNode[] = []): void
	{
		const stack: { node: TreeNode, ancestors: TreeNode[] }[] = [{ node: currentNode, ancestors: ancestors }];
	  
		while (stack.length > 0)
		{
		  const { node, ancestors } = stack.pop()!;
	  
		  result.push(...this.getAllAncestorsNodes(node, ancestors));
	  
		  ancestors.push(node);
	  
		  for (const child of inverseTree.get(node.Role) ?? [])
		  {
				stack.push({ node: child, ancestors: [...ancestors] });
		  }
		}
	  }

	/**
	 * Create and add nodes to the result array.
	 * Nodes are created for each of the node's ancestors, and a self pointing
	 * node as well.
	 * @param {PapiRole} node - The node to start the search from.
	 * @param {PapiRole[]} ancestors - The array of ancestor nodes to pass down the search path.
 	 * @param {PapiRole[]} result - The array to add visited nodes to.
	 */
	protected getAllAncestorsNodes(node: TreeNode, ancestors: TreeNode[]): TreeNode[]
	{
		const result: TreeNode[] = []
		// Add nodes for each ancestor
		for (const ancestor of ancestors) 
		{
			result.push({
				Role: node.Role,
				ParentRole: ancestor.Role
			});
		}

		return result;
	}

	/**
	 * 
	 * @param {TreeNode[]} treeNodes - The nodes to which a Key property should be added.
	 * @returns {KeyedTreeNode[]} - The nodes with a unique Key property.
	 */
	protected addKeysToTreeNodes(treeNodes: TreeNode[]): KeyedTreeNode[]
	{
		return treeNodes.map(treeNode => 
		{
			return {
				...treeNode,
				Key: `${treeNode.Role}_${treeNode.ParentRole}`
			};
		});
	}
}
