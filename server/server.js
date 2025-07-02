const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建 HTTP 服务器，用于提供前端静态文件
const server = http.createServer((req, res) => {
    // 简单的静态文件服务器，实际项目中可以使用更复杂的工具如 Express
    const filePath = req.url === '/' ? '/index.html' : req.url;
    const fileExtension = path.extname(filePath);
    const allowedExtensions = ['.html', '.js', '.css'];
    if (allowedExtensions.includes(fileExtension)) {
        fs.readFile(path.join(__dirname, '../frontend/index.html'), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200);
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end('File not found');
    }
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

// 当 WebSocket 服务器接收到请求时处理
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// 存储所有连接的客户端
const clients = new Set();

// 监听客户端连接事件
wss.on('connection', (ws, req) => {
    console.log('新客户端连接');
    clients.add(ws);

    // 广播新用户加入的消息
    const joinMessage = '有新用户加入了聊天';
    clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(joinMessage);
        }
    });

    // 监听客户端发送的消息
    ws.on('message', (message) => {
        console.log('收到消息:', message);

        // 将消息转发给所有客户端（包括发送者）
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    // 监听客户端断开连接事件
    ws.on('close', () => {
        console.log('客户端断开连接');
        clients.delete(ws);

        // 广播用户离开的消息
        const leaveMessage = '有用户离开了聊天';
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(leaveMessage);
            }
        });
    });

    // 监听 WebSocket 错误事件
    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
    });
});

// 启动服务器
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`服务器已启动，监听端口: ${PORT}`);
    console.log('访问 http://localhost:8080 查看前端页面');
});