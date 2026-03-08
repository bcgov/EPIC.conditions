import { SubconditionModel } from "@/models/Subcondition";
import { UniqueIdentifier } from "@dnd-kit/core";

export type TreeItem = SubconditionModel & {
    parentId: string | null;
    depth: number;
    collapsed?: boolean;
};

export type FlattenedItem = TreeItem & {
    children?: FlattenedItem[]; // Keeping this optional structure if we ever need it internally
};

function flatten(
    items: SubconditionModel[],
    parentId: string | null = null,
    depth = 0
): FlattenedItem[] {
    return items.reduce<FlattenedItem[]>((acc, item, index) => {
        return [
            ...acc,
            { ...item, parentId, depth, sort_order: index + 1 },
            ...flatten(item.subconditions ?? [], item.subcondition_id, depth + 1),
        ];
    }, []);
}

export function flattenTree(items: SubconditionModel[]): FlattenedItem[] {
    return flatten(items);
}

export function buildTree(flattenedItems: FlattenedItem[]): SubconditionModel[] {
    const itemMap: Record<string, SubconditionModel> = {};
    const rootItems: SubconditionModel[] = [];

    // First pass: create deep copies of all items and initialize empty arrays
    // Strip out the flattened metadata (parentId, depth) since our DB structure doesn't use it.
    for (const item of flattenedItems) {
        const { parentId, depth, collapsed, ...pureSubcondition } = item;
        itemMap[item.subcondition_id] = {
            ...pureSubcondition,
            subconditions: [],
        };
    }

    // Second pass: Link children to their respective parents
    for (const flatItem of flattenedItems) {
        const currentItem = itemMap[flatItem.subcondition_id];
        if (flatItem.parentId) {
            if (itemMap[flatItem.parentId]) {
                itemMap[flatItem.parentId].subconditions!.push(currentItem);
            } else {
                // Fallback if parent is missing due to weird state
                rootItems.push(currentItem);
            }
        } else {
            rootItems.push(currentItem);
        }
    }

    // Function to re-apply strictly 1-based sort orders across the whole tree
    const reorderTree = (items: SubconditionModel[]) => {
        items.forEach((_, index) => {
            items[index].sort_order = index + 1;
            if (items[index].subconditions?.length) {
                reorderTree(items[index].subconditions);
            }
        });
    };
    reorderTree(rootItems);
    return rootItems;
}

export function getDepth(item: FlattenedItem, parentId: string | null, items: FlattenedItem[]): number {
    if (parentId === null) {
        return 0;
    }
    const parent = items.find((i) => i.subcondition_id === parentId);
    return parent ? parent.depth + 1 : 0;
}

function getDragDepth(offset: number, indentationWidth: number) {
    return Math.round(offset / indentationWidth);
}

export function getProjection(
    items: FlattenedItem[],
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    dragOffset: number,
    indentationWidth: number
) {
    const overItemIndex = items.findIndex(({ subcondition_id }) => subcondition_id === overId);
    const activeItemIndex = items.findIndex(({ subcondition_id }) => subcondition_id === activeId);
    const activeItem = items[activeItemIndex];

    // Calculate relative indentation
    const newItems = [...items];
    newItems.splice(activeItemIndex, 1);
    newItems.splice(
        overItemIndex,
        0,
        activeItem
    );

    const previousItem = newItems[overItemIndex - 1];

    let projectedDepth = activeItem.depth + getDragDepth(dragOffset, indentationWidth);

    // Validation: Don't allow negative depth
    if (projectedDepth < 0) {
        projectedDepth = 0;
    }

    // Validation: Can't indent more than previous item + 1
    const maxDepth = previousItem ? previousItem.depth + 1 : 0;
    if (projectedDepth > maxDepth) {
        projectedDepth = maxDepth;
    }

    let projectedParentId: string | null = null;
    // If the previous item is exactly 1 level above us, it's our direct parent.
    // If the previous item is at the same level, its parent is our parent.
    // If the projected depth is 0, we are a root item.

    if (projectedDepth === 0) {
        projectedParentId = null;
    } else if (previousItem) {
        if (previousItem.depth === projectedDepth - 1) {
            projectedParentId = previousItem.subcondition_id;
        } else {
            // Look up the chain for the correct parent
            let currentParent = items.find(i => i.subcondition_id === previousItem.parentId);
            while (currentParent && currentParent.depth >= projectedDepth) {
                currentParent = items.find(i => i.subcondition_id === currentParent?.parentId);
            }
            projectedParentId = currentParent?.subcondition_id ?? null;
        }
    }

    return { depth: projectedDepth, maxDepth, minDepth: 0, parentId: projectedParentId };
}
