#!/bin/bash

# 构建 Docker 镜像
docker build -t api-business .

# 运行 Docker 容器
docker run -d -p 3000:3000 --name api-business-container api-business

# 查看容器状态
docker ps

echo "部署完成！API 业务系统已在 http://localhost:3000 上运行"
echo "API 文档地址：http://localhost:3000/api-docs"