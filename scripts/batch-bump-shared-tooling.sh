#!/bin/bash
set -euo pipefail

# Bump .shared-tooling submodule across every workspace repo that uses it.
# Usage: ./scripts/batch-bump-shared-tooling.sh [workspace-dir] [--dry-run]

WORKSPACE="/Users/marvin/Workspace"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    /*) WORKSPACE="$arg" ;;
  esac
done

COMMIT_MSG="chore(tooling): bump shared-tooling for GUI Git node PATH fix"

discover_projects() {
  local repo_path name has_submodule
  for repo_path in "$WORKSPACE"/*; do
    [ -d "$repo_path/.git" ] || continue
    has_submodule=false
    if [ -f "$repo_path/.gitmodules" ] && grep -q '\.shared-tooling' "$repo_path/.gitmodules" 2>/dev/null; then
      has_submodule=true
    elif [ -d "$repo_path/.shared-tooling/.git" ]; then
      has_submodule=true
    elif git -C "$repo_path" config --get submodule..shared-tooling.path >/dev/null 2>&1; then
      has_submodule=true
    fi
    [ "$has_submodule" = true ] || continue
    name=$(basename "$repo_path")
    printf '%s\n' "$name"
  done | sort -u
}

default_branch() {
  local branch
  branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  if [ -n "$branch" ]; then
    echo "$branch"
    return
  fi
  branch=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
  echo "${branch:-main}"
}

PROJECTS=()
while IFS= read -r project; do
  [ -n "$project" ] && PROJECTS+=("$project")
done < <(discover_projects)

echo "=== Batch Shared-Tooling Submodule Bump ==="
echo "Workspace: $WORKSPACE"
echo "Dry run:   $DRY_RUN"
echo "Repos:     ${#PROJECTS[@]}"
echo ""

PUSHED=0
SKIPPED=0
FAILED=0
FAILED_LIST=()

for project in "${PROJECTS[@]}"; do
  repo_path="$WORKSPACE/$project"

  echo "--- $project ---"
  set +e
  (
    cd "$repo_path"
    branch=$(default_branch)

    git submodule update --init --recursive .shared-tooling 2>/dev/null || true
    git submodule sync .shared-tooling 2>/dev/null || true
    git config submodule..shared-tooling.url https://github.com/FutureHax/futurehax-shared-tooling.git 2>/dev/null || true
    git submodule update --remote .shared-tooling

    if git diff --quiet .shared-tooling && git diff --cached --quiet .shared-tooling; then
      echo "SKIP: $project (submodule already at latest)"
      exit 3
    fi

    if [ "$DRY_RUN" = true ]; then
      old=$(git diff --submodule=log .shared-tooling | head -5)
      echo "  [dry-run] would commit and push on branch $branch"
      git diff --submodule=short .shared-tooling || true
      exit 0
    fi

    git add .shared-tooling
    HUSKY=0 git commit -m "$COMMIT_MSG"
    if ! git remote get-url origin >/dev/null 2>&1; then
      echo "SKIP push: $project (no origin remote; local commit only)"
      exit 0
    fi
    git pull --rebase origin "$branch"
    git push origin "$branch"
  )
  status=$?
  set -e
  case $status in
    0) PUSHED=$((PUSHED + 1)); echo "OK: $project" ;;
    3) SKIPPED=$((SKIPPED + 1)) ;;
    *) FAILED=$((FAILED + 1)); FAILED_LIST+=("$project"); echo "FAIL: $project" ;;
  esac
  echo ""
done

echo "=== Summary ==="
echo "Pushed:  $PUSHED"
echo "Skipped: $SKIPPED"
echo "Failed:  $FAILED"
if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  printf '  - %s\n' "${FAILED_LIST[@]}"
fi

exit $(( FAILED > 0 ? 1 : 0 ))
