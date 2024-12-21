# Silent Arcana

**Silent Arcana** は、手話学習をゲーム化することで、多様な人材が自然にコミュニケーションスキルを身につけられるWebプラットフォームです。  
このプロジェクトは、ろう者・難聴者と健聴者が共に働く職場環境で、言語バリアを解消することを目指します。

## 特徴
- **ブラウザ上の手話認識**: TensorFlow.jsを用いたリアルタイム手話判定
- **ゲーミフィケーション**: スコアリング・実績解除による継続的学習
- **軽量ホスティング**: GitHub Pagesで無料・容易に公開可能

## デモ
[Live Demo](https://t-9.io.github.io/silent-arcana/)

## 開発環境のセットアップ
```bash
git clone git@github.com:t-9/silent-arcana.git
cd silent-arcana
npm install
npm run build
npm start
```

ブラウザで http://localhost:8080 にアクセスするとローカル実行版を確認できます。
テストは npm test で実行可能です。

## Dockerでの実行方法

このプロジェクトはDockerを用いてコンテナ上で実行することもできます。
コンテナ内で依存関係が解決され、ポートをローカルにマッピングするだけで簡易な隔離環境で動作を確認できます。
### 手順

1. Dockerイメージのビルド:
``` bash
docker build -t silent-arcana .
```

Dockerfileに基づいてコンテナイメージが作成されます。

2. コンテナの起動:
``` bash
docker run -it --rm -p 8080:8080 silent-arcana
```

**-p 8080:8080**でホストの8080番ポートをコンテナ内の8080番ポートにマッピングします。

3. ブラウザでアクセス:

http://localhost:8080
これでDockerコンテナ内でアプリが稼働している状態でローカルからアクセスできます。

### テスト（Docker上で実行）

テストをDocker上で実行したい場合、ビルド後に以下のようなコマンドを実行することが可能です

```bash
# Dockerイメージ内でテスト実行
docker run -it --rm silent-arcana npm test
```

## 技術スタック
- Node.js
- Webpack
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Docker](https://www.docker.com/)
- [GitHub Actions](https://github.co.jp/features/actions)
- [GitHub Pages](https://docs.github.com/ja/pages/getting-started-with-github-pages/about-github-pages)
- [Jest](https://jestjs.io/)
- [serve](https://github.com/vercel/serve)

## CI/CD
- **GitHub Actions**: プルリク・push時に自動テスト (npm test)、ビルド (npm run build) を実施
- **Pagesデプロイ**: メインブランチへのpush後、public/配下をgh-pagesブランチへ自動反映し、GitHub Pagesで公開

## コントリビューション
IssueやPull Requestでの改善提案やバグ報告を歓迎します。

## ライセンス
This project is licensed under the [MIT License](LICENSE).
