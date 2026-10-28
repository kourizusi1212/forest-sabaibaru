# 🌲 森の4人サバイバル

部屋コードで集まる、4人協力の一人称3Dサバイバルゲーム(Three.js + WebSocket)。

## ローカルで動かす
```
npm install
npm start      # http://localhost:3000
```
「部屋を作る」で4文字のコードが発行されます。他の人は同じURLを開いてコードを入力して入室します(`?room=CODE` 付きURLでも可)。

## GitHub に公開
```
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<you>/forest-survival.git
git push -u origin main
```

## Render にデプロイ
1. Render の Dashboard → New → **Blueprint**(または Web Service)でこのリポジトリを選択
2. `render.yaml` が自動で読み込まれます(Web Service の場合: Build `npm install` / Start `npm start`)
3. 発行された `https://xxx.onrender.com` を仲間に共有

※ 無料プランは15分アクセスがないとスリープし、起動に少し時間がかかります。部屋はサーバーのメモリ上にあるため、再起動すると消えます。
※ GitHub Pages は WebSocket サーバーを動かせないため、サーバー部分は Render などに置いてください。

## 構成
- `server.js` … 部屋管理と状態の中継(最大4人/部屋、部屋コードごとに世界のシード・昼夜の時計を共有)
- `public/index.html` … ゲーム本体
