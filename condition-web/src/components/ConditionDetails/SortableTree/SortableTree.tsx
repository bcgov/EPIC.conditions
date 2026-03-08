import React, { useState, useEffect, useMemo } from 'react';
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
    DragOverlay,
    defaultDropAnimationSideEffects,
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
import SubconditionComponent from '../SubCondition';

const indentationWidth = 20;

const dropAnimationConfig = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
};

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
    const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

    // Sync prop items to local flattened state
    useEffect(() => {
        setFlattenedItems(flattenTree(items));
    }, [items]);

    const handleCollapse = (id: string) => {
        setCollapsedIds((prev) =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const visibleItems = useMemo(() => {
        let hideUntilDepth: number | null = null;
        return flattenedItems.filter((item) => {
            if (hideUntilDepth !== null && item.depth > hideUntilDepth) {
                return false;
            }
            hideUntilDepth = null;
            if (collapsedIds.includes(item.subcondition_id)) {
                hideUntilDepth = item.depth;
            }
            return true;
        });
    }, [flattenedItems, collapsedIds]);

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
        visibleItems,
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
            const activeIndexFlat = flattenedItems.findIndex(i => i.subcondition_id === active.id);
            const activeVisibleIndex = visibleItems.findIndex(i => i.subcondition_id === active.id);
            const overVisibleIndex = visibleItems.findIndex(i => i.subcondition_id === over.id);

            const clonedItems = [...flattenedItems];
            const [movedItem] = clonedItems.splice(activeIndexFlat, 1);

            // Finalize depth and parent ID changes
            movedItem.depth = projected.depth;
            movedItem.parentId = projected.parentId;

            let insertIndex;
            if (activeVisibleIndex < overVisibleIndex) {
                // Dragged down. Find next visible item to insert before it in the flattened list.
                const nextVisibleItem = visibleItems[overVisibleIndex + 1];
                if (nextVisibleItem) {
                    insertIndex = clonedItems.findIndex(i => i.subcondition_id === nextVisibleItem.subcondition_id);
                } else {
                    insertIndex = clonedItems.length;
                }
            } else {
                // Dragged up. Insert before the over item in the flattened list.
                insertIndex = clonedItems.findIndex(i => i.subcondition_id === over.id);
            }

            clonedItems.splice(insertIndex, 0, movedItem);

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



    const activeItem = activeId ? flattenedItems.find((item) => item.subcondition_id === activeId) : null;

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
                items={visibleItems.map((item) => item.subcondition_id)}
                strategy={verticalListSortingStrategy}
            >
                <Box sx={{ minHeight: isEditing && visibleItems.length === 0 ? '50px' : '0px' }}>
                    {visibleItems.map((item) => {
                        const flatIndex = flattenedItems.findIndex(i => i.subcondition_id === item.subcondition_id);
                        const hasChildren = flattenedItems[flatIndex + 1]?.depth > item.depth;
                        return (
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
                                isActiveDropTarget={item.subcondition_id === activeId}
                                hasChildren={hasChildren}
                                collapsed={collapsedIds.includes(item.subcondition_id)}
                                onCollapse={() => handleCollapse(item.subcondition_id)}
                            />
                        )
                    })}
                </Box>
            </SortableContext>

            <DragOverlay dropAnimation={dropAnimationConfig}>
                {activeItem && isEditing ? (
                    <div style={{
                        transform: 'rotate(2deg) scale(1.02)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        cursor: 'grabbing',
                        borderRadius: '4px',
                        backgroundColor: '#fff'
                    }}>
                        <SubconditionComponent
                            subcondition={activeItem}
                            indentLevel={0}
                            isEditing={isEditing}
                            onEdit={() => { }} // Disabled in overlay
                            onDelete={() => { }}
                            onAdd={() => { }}
                            identifierValue={activeItem.subcondition_identifier || ''}
                            textValue={activeItem.subcondition_text || ''}
                            is_approved={isApproved}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
