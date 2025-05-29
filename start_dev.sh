#!/bin/bash

SESSION="agri_eye"

tmux new-session -d -s $SESSION

# Redis
tmux rename-window -t $SESSION:0 'redis'
tmux send-keys -t $SESSION 'redis-server' C-m

# Celery
tmux new-window -t $SESSION:1 -n 'celery'
tmux send-keys -t $SESSION 'cd backend && source venv/bin/activate && celery -A celery_app worker --loglevel=info' C-m

# Backend
tmux new-window -t $SESSION:2 -n 'backend'
tmux send-keys -t $SESSION 'cd backend && source venv/bin/activate && uvicorn main:app --reload' C-m

# Frontend
tmux new-window -t $SESSION:3 -n 'frontend'
tmux send-keys -t $SESSION 'cd frontend && npm run dev' C-m

# 表示
tmux select-window -t $SESSION:2
tmux attach -t $SESSION
