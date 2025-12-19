# tobira-kagi 🗝️

> **認証基盤「Tobira」専用の「鍵」ミドルウェア**
> **OIDC？そんな面倒なことはしません。AIに任せて、あなたは寝ていてください。**

**tobira-kagi** は、**[Tobira (IdP)](https://github.com/n416/tobira)** を Hono アプリケーションに組み込むための公式ミドルウェアです。

## ⚡ Tobira の哲学

- **🚫 脱・OIDC**: 複雑な仕様書は捨てました。シンプルなJSON交換だけで認証します。
- **🤖 AIネイティブ**: AI (Cursor/Windsurf) に指示するためだけに設計されています。
- **🚀 爆速 Service Binding**: Cloudflare Workers 間の内部通信により、通信ラグゼロで認証チェックを行います。

---

## 🚪 Step 0: 準備 (扉を設置する)

鍵 (ライブラリ) を使う前に、扉 (Tobira) を用意し、通行証 (App ID) を発行する必要があります。

1. **Tobiraのデプロイ**: 👉 **[Tobira 本体 (サーバー) のリポジトリへ](https://github.com/n416/tobira)**
2. **App IDの取得**: Tobira管理画面でアプリを登録し、**アプリID** をコピーしてください。

---

## 🛠️ インストール

```bash
npm install git+https://github.com/n416/tobira-kagi.git
```

---

## 🚀 使い方 (AI流)

**コードを書く必要はありません。**

1.  ライブラリをインストールします。
2.  **AI エディタに指示** します。

> **「`node_modules/tobira-kagi/INSTRUCTION_ja.md` を読んで。その手順に従って `src/index.ts` など対象アプリのエンドポイントに合わせてファイルを生成あるいはマージ、認証機能を実装してください。私のアプリIDは 'YOUR_APP_ID' です。」**

*(※ 'YOUR_APP_ID' は Step 0 で取得したIDに書き換えてください)*

以上です。AI が内部の指示書を読み込み、既存コードとの整合性を取りながら実装を行います。

---

## 👨‍💻 使い方 (リファレンス / 手動)

手動で実装する場合、またはAIの生成結果を確認したい場合は、以下のコードを参考にしてください。

```typescript
import { Hono } from 'hono'
import { Kagi } from 'tobira-kagi'

type Bindings = {
  AUTH_URL: string
  TOBIRA: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

// 初期化ヘルパー (環境変数を渡すため)
const getKagi = (c: any) => new Kagi({
  authUrl: c.env.AUTH_URL,
  appId: 'YOUR_APP_ID',
  fetcher: c.env.TOBIRA
})

// 1. 認証ルート (/auth/*) を委譲
app.all('/auth/*', (c) => getKagi(c).handlers().fetch(c.req.raw, c.env, c.executionCtx))

// 2. ガード設定 (これより下のルートは保護されます)
app.use('/*', async (c, next) => {
  if (c.req.path.startsWith('/auth')) return next()
  return getKagi(c).guard()(c, next)
})

export default app
```

## License

MIT
