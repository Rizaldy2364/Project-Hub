const fs = require('fs');

// 1. Fix project.actions.ts
let actions = fs.readFileSync('actions/project.actions.ts', 'utf8');
if (!actions.includes('removeProjectMember,')) {
  actions = actions.replace(
    'updateProject,',
    'updateProject,\n  removeProjectMember,'
  );
  fs.writeFileSync('actions/project.actions.ts', actions, 'utf8');
}

// 2. Fix kanban-board-tab.tsx
let kanban = fs.readFileSync('components/project/kanban-board-tab.tsx', 'utf8');

// Fix DialogContent className error
kanban = kanban.replace(/<DialogContent title="Tendang Member" className="sm:max-w-md">/g, '<DialogContent title="Tendang Member">');
kanban = kanban.replace(/<DialogContent title="Profil User" className="sm:max-w-md">/g, '<DialogContent title="Profil User">');
kanban = kanban.replace(/<DialogContent title="Detail Task" className="sm:max-w-md">/g, '<DialogContent title="Detail Task">');
kanban = kanban.replace(/<DialogContent title="Detail Task" className="sm:max-w-xl">/g, '<DialogContent title="Detail Task">');
// Note: If DialogContent has any other classNames, we'll remove them. Let's just blindly remove them if they exist for DialogContent.
kanban = kanban.replace(/<DialogContent([^>]*) className="[^"]*"/g, '<DialogContent$1');

// Fix UserAvatar size error
kanban = kanban.replace(/size="lg"/g, 'size="md"');

// Fix 3 dots (ellipsis) logic
const ellipsisRegex = /\{isAdmin && member\.role !== "ADMIN" \? \([\s\S]*?<Trash2 className="w-4 h-4" \/>\s*<\/button>\s*\) : \(\s*<button className="text-slate-400 hover:text-slate-200 transition-colors">\s*<MoreHorizontal className="w-5 h-5" \/>\s*<\/button>\s*\)\}/m;

const newLogic = `{isAdmin ? (
                        member.role !== "ADMIN" ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setKickMember(member); }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null
                      ) : (
                        <button className="text-slate-400 hover:text-slate-200 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      )}`;

kanban = kanban.replace(ellipsisRegex, newLogic);

fs.writeFileSync('components/project/kanban-board-tab.tsx', kanban, 'utf8');
console.log('done fixing errors');
