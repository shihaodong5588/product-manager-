#!/bin/bash

# 从.env文件读取API密钥
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

TASK_ID=$1

if [ -z "$TASK_ID" ]; then
  echo "Usage: ./check-task.sh <task_id>"
  exit 1
fi

echo "Checking task: $TASK_ID"
echo "API Key: ${MIDJOURNEY_API_KEY:0:10}..."
echo ""

curl -X GET "https://api.qinzhiai.com/mj/task/${TASK_ID}/fetch" \
  -H "mj-api-secret: ${MIDJOURNEY_API_KEY}" \
  -H "Content-Type: application/json" | jq .
