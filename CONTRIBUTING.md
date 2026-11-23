# Git workflow

`main` is the release branch and `DevTutor` is the branch for preview and integration.
Use a short branch name that describes the change, such as `feature/project-gallery` or `fix/photo-sizing`.

When a change has independent parts, branch each part from the same integration point. Use a shared prefix to keep the branches together in the branch list. For example, create `feature/navigation/integration` and branch `feature/navigation/menu` and `feature/navigation/transitions` from it before merging either part.

1. Commit and test each part on its own branch.
2. Merge the completed branches into the integration branch with `git merge --no-ff <branch>` so each merge is visible in the graph.
3. Merge the integration branch into `DevTutor` and test the combined changes there before releasing through `main`.

Run this command from the repository root to see the branch history and merge points.

```bash
git log --graph --topo-order --oneline --decorate --all
```
