"use client";

import { useState } from "react";
import { BoardView } from "@/components/board/board-view";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import type { BoardProject, BoardTask } from "@/types";

interface TaskBoardShellProps {
  project: BoardProject;
  currentUser: { id: string; name: string; avatarUrl: string | null };
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
}

/** Shell tab Task: BoardView + modal detail task (dipindahkan dari KanbanBoardTab). */
export function TaskBoardShell({
  project,
  currentUser,
  canEdit,
  canDelete,
  canComment,
}: TaskBoardShellProps) {
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  return (
    <div className="space-y-5">
      <BoardView project={project} onSelectTask={setSelectedTask} />

      {selectedTask && (
        <TaskDetailModal
          key={selectedTask.id}
          task={selectedTask}
          canEdit={canEdit}
          canDelete={canDelete}
          canComment={canComment}
          currentUser={currentUser}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
}