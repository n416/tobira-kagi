# tobira-kagi 🗝️

> **認証基盤「Tobira」専用の「鍵」ミドルウェア**
> **Cloudflare Workers も Pages (静的サイト) も、これ一つで守ります。**

[![npm version](https://badge.fury.io/js/tobira-kagi.svg)](https://badge.fury.io/js/tobira-kagi)

## ⚠️ 動作環境

**サーバーサイド (Edge) で動作するミドルウェアです。**

* ✅ **対応**: Cloudflare Workers, Cloudflare Pages (Functions / `_worker.js`)
* ❌ **非対応**: 一般的なレンタルサーバー (Apache/Nginxのみの環境), ブラウザ単体のJS

---

## ⚡ 特徴

- **🛡️ あらゆるアプリに対応**: **API** (Workers) だけでなく、**静的サイト** (Pages) にも認証をかけられます。
- **🤖 AIネイティブ**: 付属の指示書が、レンタルサーバーからの移行手順もAIに教えます。
- **🚀 爆速**: Cloudflare **Service Bindings** による内部通信で認証チェック。

---

## 🚪 Step 0: 準備

1. **Tobiraのデプロイ**: 👉 **[Tobira 本体 (サーバー) のリポジトリへ](https://github.com/n416/tobira)**
2. **App IDの取得**: Tobira管理画面でアプリを登録し、IDをコピーしてください。

---

## 🛠️ インストール

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

---

## 🚀 使い方 (AI流)

**コードは書きません。AIに「診断」させます。**

1.  ライブラリをインストールします。
2.  **AI エディタに指示** します。

> **「`node_modules/tobira-kagi/INSTRUCTION_ja.md` を読んでください。私のプロジェクトを分析し、最適な導入手順を『提案』してください。まだコードは書かないでください。アプリIDは 'YOUR_APP_ID' です。」**

AI はファイルをチェックし、**「HTMLファイルがありますね。Cloudflare Pages で認証付きサイトにしますか？」** とあなたに確認します。
**「はい」** と答えれば、実装が始まります。

---

## 👨‍💻 使い方 (手動リファレンス)

### パターン A: Cloudflare Workers (API / アプリ)

通常の Hono アプリケーションの場合です。

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()

// 初期化
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 1. 認証ルート (/auth/*) の委譲
app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

// 2. ガード設定
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

### パターン B: Cloudflare Pages (静的サイトの保護)

レンタルサーバーから移行したHTMLファイルを保護する場合、`env.ASSETS` を使います。

```typescript
// _worker.js または functions/[[path]].ts
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

const app = new Hono()
// ... (初期化は上と同じ) ...

app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  
  // ガード実行。未認証ならリダイレクトが返る
  const response = await getKagi(c).guard()(c, next)
  if (response) return response

  // 認証OKなら、Pagesにアップロードされた静的ファイル(HTML等)を配信
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
```

## License

MIT
