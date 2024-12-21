// release.config.js
export default {
  branches: [
    "main",
    // リリース対象とするブランチを必要に応じて列挙
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        // コミットメッセージからバージョンアップの種類(Major/Minor/Patch)を判定
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        // リリースノートのテンプレート生成
      }
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false // npmにパッケージ公開しない場合はfalse
      }
    ],
    [
      "@semantic-release/github",
      {
        // GitHub Releaseにアップロード
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ],
};
