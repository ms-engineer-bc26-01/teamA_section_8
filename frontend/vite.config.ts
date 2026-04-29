/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  // ここからテスト用の設定を追加！
  test: {
    globals: true, // describe や expect を import なしで使えるようにする
    environment: "jsdom", // ブラウザ環境をシミュレートする（Reactの描画に必要）
    setupFiles: ["./src/test/setup.ts"], // テスト実行前に読み込む準備ファイルを指定
  },
});
