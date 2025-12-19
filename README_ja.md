# Tobira 🚪

> **OIDC？そんな面倒なことはしません。**
> **アプリごとにログイン画面を作るのも、もう終わりです。**

**Tobira** は、**Cloudflare Workers** と **D1** で動作する、個人のための「俺用」認証基盤です。
「標準仕様準拠」なんていう重たい看板は捨てました。欲しいのは、**爆速で、無料で、AIが一発で実装してくれる** シンプルな認証だけです。

## ⚡ Tobira の哲学

* **🚫 脱・OIDC (Anti-OIDC)**
    * OpenID Connect は素晴らしいですが、個人開発には重すぎます。Tobira は単純な JSON 交換だけで認証を完結させます。仕様書を読む時間は不要です。
* **🤖 AIファースト (AI-Native)**
    * ミドルウェア `tobira-kagi` は、AI (Cursor/Windsurf) に指示するためだけに最適化されています。「認証入れて」の一言で実装は終わります。
* **💸 無料最高！D1最高！**
    * Cloudflare D1 (SQLite) ベースなので、個人利用なら実質無限に無料です。維持費ゼロで自分だけの認証基盤が手に入ります。
* **🚀 爆速 Service Binding**
    * 同じ Cloudflare アカウント内なら、HTTP 通信すら発生しません。関数呼び出しレベルの速度で認証チェックが完了します。

---

## 🛠️ Tobira (IdP本体) の構築

### 1. デプロイ

このリポジトリをクローンして、あなたの Cloudflare アカウントにデプロイしてください。

```bash
git clone https://github.com/n416/tobira.git
cd tobira
npm install

# D1データベースの作成（これこそが無料の源！）
wrangler d1 create tobira-db
wrangler d1 execute tobira-db --file=./schema.sql

# ローカル起動
npm run dev
```

ダッシュボード (`http://localhost:8787`) にアクセスして、管理を開始してください。

---

## 🔐 クライアントアプリへの導入

あなたが作るアプリ（家計簿アプリ、ToDoアプリなど）には、専用ミドルウェア **`tobira-kagi`** を入れてください。
これを入れるだけで、ログイン・ログアウト・セッション管理が全て解決します。

### インストール方法

npm には公開していません（Githubこそが正義）。以下のコマンドでインストールしてください。

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

### 使い方

AI に**「tobira-kagi の INSTRUCTION.md を読んで実装して」**と伝えるだけです。
人間が書くコードはこれだけです：

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

// ... 実装詳細は tobira-kagi のドキュメントを参照
```

---

## License

MIT. 好きなだけ使い倒してください。
