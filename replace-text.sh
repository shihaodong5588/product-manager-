#!/bin/bash

# 批量替换项目中的英文文本为中文

# Requirements page
sed -i '' 's/"Cancel"/"取消"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Create"/"创建"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Save"/"保存"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Edit"/"编辑"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Delete"/"删除"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"View"/"查看"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Actions"/"操作"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Loading..."/"加载中..."/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Description"/"描述"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Estimated Hours"/"预估工时"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Actual Hours"/"实际工时"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Created"/"创建时间"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx
sed -i '' 's/"Updated"/"更新时间"/g' /Users/shihaodong/Trae/product-manager/app/**/*.tsx

echo "替换完成"
