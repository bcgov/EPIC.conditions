import { SubconditionModel } from "@/models/Subcondition";

export const ROOT_DROPPABLE_ID = "subconditions-droppable";

type NodeLocation = {
  parentId: string;
  index: number;
};

const cloneNodes = (nodes: SubconditionModel[]): SubconditionModel[] =>
  nodes.map((node) => ({
    ...node,
    subconditions: cloneNodes(node.subconditions || []),
  }));

const normalizeSortOrder = (nodes: SubconditionModel[]): SubconditionModel[] =>
  nodes.map((node, index) => ({
    ...node,
    sort_order: index + 1,
    subconditions: normalizeSortOrder(node.subconditions || []),
  }));

const findNodeLocation = (
  nodes: SubconditionModel[],
  nodeId: string,
  parentId = ROOT_DROPPABLE_ID
): NodeLocation | null => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (node.subcondition_id === nodeId) {
      return { parentId, index };
    }

    const nestedLocation = findNodeLocation(
      node.subconditions || [],
      nodeId,
      node.subcondition_id
    );

    if (nestedLocation) {
      return nestedLocation;
    }
  }

  return null;
};

const findNodeById = (
  nodes: SubconditionModel[],
  nodeId: string
): SubconditionModel | undefined => {
  for (const node of nodes) {
    if (node.subcondition_id === nodeId) {
      return node;
    }

    const nestedNode = findNodeById(node.subconditions || [], nodeId);
    if (nestedNode) {
      return nestedNode;
    }
  }

  return undefined;
};

const reorderInParent = (
  nodes: SubconditionModel[],
  parentId: string,
  fromIndex: number,
  toIndex: number
): SubconditionModel[] => {
  if (parentId === ROOT_DROPPABLE_ID) {
    const nextNodes = [...nodes];
    const [movedNode] = nextNodes.splice(fromIndex, 1);
    nextNodes.splice(toIndex, 0, movedNode);
    return nextNodes;
  }

  return nodes.map((node) => {
    if (node.subcondition_id === parentId) {
      const nextChildren = [...(node.subconditions || [])];
      const [movedNode] = nextChildren.splice(fromIndex, 1);
      nextChildren.splice(toIndex, 0, movedNode);

      return {
        ...node,
        subconditions: nextChildren,
      };
    }

    return {
      ...node,
      subconditions: reorderInParent(node.subconditions || [], parentId, fromIndex, toIndex),
    };
  });
};

const removeFromParent = (
  nodes: SubconditionModel[],
  parentId: string,
  index: number,
  takeTrailingSiblings = false
): {
  tree: SubconditionModel[];
  removedNode?: SubconditionModel;
  trailingSiblings: SubconditionModel[];
} => {
  if (parentId === ROOT_DROPPABLE_ID) {
    const nextNodes = [...nodes];
    const [removedNode] = nextNodes.splice(index, 1);
    const trailingSiblings = takeTrailingSiblings ? nextNodes.splice(index) : [];

    return { tree: nextNodes, removedNode, trailingSiblings };
  }

  let removedNode: SubconditionModel | undefined;
  let trailingSiblings: SubconditionModel[] = [];

  const nextNodes = nodes.map((node) => {
    if (node.subcondition_id === parentId) {
      const nextChildren = [...(node.subconditions || [])];
      [removedNode] = nextChildren.splice(index, 1);

      if (takeTrailingSiblings) {
        trailingSiblings = nextChildren.splice(index);
      }

      return {
        ...node,
        subconditions: nextChildren,
      };
    }

    const nested = removeFromParent(node.subconditions || [], parentId, index, takeTrailingSiblings);
    if (nested.removedNode) {
      removedNode = nested.removedNode;
      trailingSiblings = nested.trailingSiblings;
    }

    return {
      ...node,
      subconditions: nested.tree,
    };
  });

  return { tree: nextNodes, removedNode, trailingSiblings };
};

const insertIntoParent = (
  nodes: SubconditionModel[],
  parentId: string,
  index: number,
  nodeToInsert: SubconditionModel
): SubconditionModel[] => {
  if (parentId === ROOT_DROPPABLE_ID) {
    const nextNodes = [...nodes];
    nextNodes.splice(index, 0, nodeToInsert);
    return nextNodes;
  }

  return nodes.map((node) => {
    if (node.subcondition_id === parentId) {
      const nextChildren = [...(node.subconditions || [])];
      nextChildren.splice(index, 0, nodeToInsert);

      return {
        ...node,
        subconditions: nextChildren,
      };
    }

    return {
      ...node,
      subconditions: insertIntoParent(node.subconditions || [], parentId, index, nodeToInsert),
    };
  });
};

export const reorderSubconditions = (
  tree: SubconditionModel[],
  parentId: string,
  fromIndex: number,
  toIndex: number
): SubconditionModel[] => {
  if (fromIndex === toIndex) {
    return tree;
  }

  return normalizeSortOrder(
    reorderInParent(cloneNodes(tree), parentId, fromIndex, toIndex)
  );
};

export const indentSubcondition = (
  tree: SubconditionModel[],
  nodeId: string
): SubconditionModel[] => {
  const location = findNodeLocation(tree, nodeId);

  if (!location || location.index === 0) {
    return tree;
  }

  const nextTree = cloneNodes(tree);
  const { tree: treeWithoutNode, removedNode } = removeFromParent(
    nextTree,
    location.parentId,
    location.index
  );

  if (!removedNode) {
    return tree;
  }

  const previousSiblingIndex = location.index - 1;
  const siblings =
    location.parentId === ROOT_DROPPABLE_ID
      ? treeWithoutNode
      : findNodeById(treeWithoutNode, location.parentId)?.subconditions || [];
  const previousSibling = siblings[previousSiblingIndex];

  if (!previousSibling) {
    return tree;
  }

  const updatedTree = insertIntoParent(
    treeWithoutNode,
    previousSibling.subcondition_id,
    (previousSibling.subconditions || []).length,
    removedNode
  );

  return normalizeSortOrder(updatedTree);
};

export const outdentSubcondition = (
  tree: SubconditionModel[],
  nodeId: string
): SubconditionModel[] => {
  const location = findNodeLocation(tree, nodeId);

  if (!location || location.parentId === ROOT_DROPPABLE_ID) {
    return tree;
  }

  const parentLocation = findNodeLocation(tree, location.parentId);
  if (!parentLocation) {
    return tree;
  }

  const nextTree = cloneNodes(tree);
  const { tree: treeWithoutNode, removedNode, trailingSiblings } = removeFromParent(
    nextTree,
    location.parentId,
    location.index,
    true
  );

  if (!removedNode) {
    return tree;
  }

  const movedNode = {
    ...removedNode,
    subconditions: [...(removedNode.subconditions || []), ...trailingSiblings],
  };

  const updatedTree = insertIntoParent(
    treeWithoutNode,
    parentLocation.parentId,
    parentLocation.index + 1,
    movedNode
  );

  return normalizeSortOrder(updatedTree);
};
