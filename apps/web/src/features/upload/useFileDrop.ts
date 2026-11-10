import type { ProjectFiles } from '@qualivis/core';
import { type DragEvent, useState } from 'react';
import { logReadError } from './logReadError';
import { readDroppedFiles } from './readDroppedFiles';

/** Drag-and-drop target like the legacy `appDropTarget` directive; spread `handlers` on the element. */
export const useFileDrop = (onFiles: (project: ProjectFiles) => void) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handlers = {
        onDragEnter: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            setIsDraggingOver(true);
        },
        onDragOver: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
        },
        onDragLeave: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            // dragleave also fires when the pointer enters a child element.
            if (event.target === event.currentTarget) {
                setIsDraggingOver(false);
            }
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            setIsDraggingOver(false);
            if (event.dataTransfer.items.length === 0) {
                return;
            }
            void readDroppedFiles(event.dataTransfer).then(onFiles, logReadError);
        },
    };

    return { isDraggingOver, handlers };
};
