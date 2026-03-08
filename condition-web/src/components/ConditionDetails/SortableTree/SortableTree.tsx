import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    DragMoveEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SubconditionModel } from '@/models/Subcondition';
import { SortableTreeItem } from './SortableTreeItem';
import { FlattenedItem, flattenTree, buildTree, getProjection } from './utilities';
import { Box } from '@mui/material';

const indentationWidth = 20;

interface SortableTreeProps {
    items: SubconditionModel[];
    onItemsChange: (items: SubconditionModel[]) => void;
    isEditing: boolean;
    onEdit: (id: string, identifier: string, text: string) => void;
    onDelete: (id: string) => void;
    onAdd: (parentId: string) => void;
    isApproved: boolean;
}

export const SortableTree: React.FC<SortableTreeProps> = ({
    items,
    onItemsChange,
    isEditing,
    onEdit,
    onDelete,
    onAdd,
    isApproved,
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [flattenedItems, setFlattenedItems] = useState<FlattenedItem[]>([]);
    const [overId, setOverId] = useState<string | null>(null);
    const [offsetLeft, setOffsetLeft] = useState(0);

    // Sync prop items to local flattened state
    useEffect(() => {
        setFlattenedItems(flattenTree(items));
    }, [items]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const projected = activeId && overId ? getProjection(
        flattenedItems,
        activeId,
        overId,
        offsetLeft,
        indentationWidth
    ) : null;

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setOverId(event.active.id as string);
        document.body.style.setProperty('cursor', 'grabbing');
    };

    const handleDragMove = (event: DragMoveEvent) => {
        setOffsetLeft(event.delta.x);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        resetState();

        if (projected && over) {
            const activeIndex = flattenedItems.findIndex(i => i.subcondition_id === active.id);
            const overIndex = flattenedItems.findIndex(i => i.subcondition_id === over.id);

            const clonedItems = [...flattenedItems];
            const [movedItem] = clonedItems.splice(activeIndex, 1);

            // Finalize depth and parent ID changes
            movedItem.depth = projected.depth;
            movedItem.parentId = projected.parentId;

            clonedItems.splice(overIndex, 0, movedItem);

            // Convert back to nested structure and emit to parent component
            const rebuiltTree = buildTree(clonedItems);
            onItemsChange(rebuiltTree);
        }
    };

    const resetState = () => {
        setOverId(null);
        setActiveId(null);
        setOffsetLeft(0);
        document.body.style.setProperty('cursor', '');
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={resetState}
        >
            <SortableContext
                items={flattenedItems.map((item) => item.subcondition_id)}
                strategy={verticalListSortingStrategy}
            >
                <Box sx={{ minHeight: isEditing && flattenedItems.length === 0 ? '50px' : '0px' }}>
                    {flattenedItems.map((item) => (
                        <SortableTreeItem
                            key={item.subcondition_id}
                            id={item.subcondition_id}
                            item={item}
                            depth={item.subcondition_id === activeId && projected ? projected.depth : item.depth}
                            indentationWidth={indentationWidth}
                            isEditing={isEditing}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAdd={onAdd}
                            isApproved={isApproved}
                        />
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    );
};
