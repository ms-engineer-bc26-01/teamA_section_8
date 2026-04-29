import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "../mocks/node";
import "@testing-library/jest-dom"; // DOMの便利な検証機能を使えるようにする

// 全テストの前にＭＳＷを起動
beforeAll(() => server.listen());

// テストごとに状態をリセット（変なデータが残らないようにする）
afterEach(() => server.resetHandlers());

// 全テストが終わったらＭＳＷを閉じる
afterAll(() => server.close());
