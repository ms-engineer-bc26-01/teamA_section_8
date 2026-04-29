import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// テスト環境用のサーバー（窓口）を作成
export const server = setupServer(...handlers);
