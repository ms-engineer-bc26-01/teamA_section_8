import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Dockerコンテナ外（ブラウザ）からのアクセスを許可
    port: 3000, // READMEの記載と合わせる
  },
});
