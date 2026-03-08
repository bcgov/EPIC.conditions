import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SubconditionComponent from '../SubCondition';
import { TreeItem } from './utilities';

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
        opacity: isDragging ? 0.4 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 1 : 0,
    };

    return (
        <div ref={setDroppableNodeRef} style={style}>
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
            />
        </div>
    );
};
