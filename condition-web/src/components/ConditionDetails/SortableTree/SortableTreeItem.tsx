import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SubconditionComponent from '../SubCondition';
import { TreeItem } from './utilities';

const DropIndicator = () => (
    <div
        style={{
            height: '4px',
            backgroundColor: '#2563eb', // Blue-600
            borderRadius: '4px',
            width: '100%',
            position: 'relative',
        }}
    >
        <div style={{
            position: 'absolute', top: '-4px', left: '-6px', width: '12px', height: '12px',
            backgroundColor: '#2563eb', borderRadius: '50%', border: '2px solid white'
        }} />
    </div>
);

interface SortableTreeItemProps {
    id: string;
    item: TreeItem;
    depth: number;
    indentationWidth: number;
    isEditing: boolean;
    onEdit: (id: string, identifier: string, text: string) => void;
    onDelete: (id: string) => void;
    onAdd: (parentId: string) => void;
    isApproved: boolean;
    isActiveDropTarget?: boolean;
    hasChildren?: boolean;
    collapsed?: boolean;
    onCollapse?: () => void;
}

export const SortableTreeItem: React.FC<SortableTreeItemProps> = ({
    id,
    item,
    depth,
    indentationWidth,
    isEditing,
    onEdit,
    onDelete,
    onAdd,
    isApproved,
    isActiveDropTarget,
    hasChildren,
    collapsed,
    onCollapse,
}) => {
    const {
        attributes,
        listeners,
        setDraggableNodeRef,
        setDroppableNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        data: {
            parentId: item.parentId,
            depth,
            index: item.sort_order - 1,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        marginLeft: `${depth * indentationWidth}px`,
        opacity: isDragging ? 0 : 1, // Hide the original item completely while dragging to prefer DragOverlay
        position: 'relative' as const,
        zIndex: isDragging ? 1 : 0,
    };

    const guideLines = Array.from({ length: depth }).map((_, index) => (
        <div
            key={index}
            style={{
                position: 'absolute',
                left: `-${(depth - index) * indentationWidth - (indentationWidth / 2)}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#cbd5e1', // Slate-300
                zIndex: -1,
            }}
        />
    ));


    return (
        <div ref={setDroppableNodeRef} style={style}>
            {guideLines}
            {isActiveDropTarget ? (
                <DropIndicator />
            ) : (
                <SubconditionComponent
                    subcondition={item}
                    indentLevel={0} // We handle padding via the wrapper's marginLeft instead
                    isEditing={isEditing}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAdd={onAdd}
                    identifierValue={item.subcondition_identifier || ''}
                    textValue={item.subcondition_text || ''}
                    is_approved={isApproved}
                    dragHandleRef={setDraggableNodeRef}
                    dragHandleProps={{ ...listeners, ...attributes }}
                    hasChildren={hasChildren}
                    collapsed={collapsed}
                    onCollapse={onCollapse}
                />
            )}
        </div>
    );
};
